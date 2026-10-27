-- =========================================================
-- 모바일 청첩장 방명록 (Supabase)
-- Supabase 대시보드 > SQL Editor 에 전체를 붙여넣고 Run
--
-- 보안 구조
--  - guestbook 테이블은 RLS ON + anon 권한 회수 → 브라우저에서 직접 select/insert/update/delete 불가
--  - 아래 RPC 함수(security definer)로만 접근. 함수는 password_hash를 절대 반환하지 않음
--  - 비밀번호는 pgcrypto bcrypt(crypt + gen_salt('bf'))로 저장/검증
--  - 같은 글에 비밀번호를 5번 틀리면 10분간 수정/삭제 잠금
-- =========================================================

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.guestbook (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  message        text not null,
  password_hash  text not null,
  failed_count   int not null default 0,
  locked_until   timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists guestbook_created_at_idx on public.guestbook (created_at desc);

alter table public.guestbook enable row level security;
-- 정책을 하나도 만들지 않음 = anon/authenticated는 테이블에 직접 접근 불가
revoke all on public.guestbook from anon, authenticated;


-- ---------- 내부 헬퍼 ----------
create or replace function public._guestbook_json(r public.guestbook)
returns json language sql immutable as $$
  select json_build_object(
    'id', r.id, 'name', r.name, 'message', r.message,
    'createdAt', r.created_at, 'updatedAt', r.updated_at
  );
$$;

create or replace function public._guestbook_check_text(p_name text, p_message text)
returns void language plpgsql as $$
begin
  if p_name is not null and char_length(trim(p_name)) not between 1 and 20 then
    raise exception '이름은 1~20자로 입력해 주세요.';
  end if;
  if char_length(trim(coalesce(p_message, ''))) not between 1 and 500 then
    raise exception '메시지는 1~500자로 입력해 주세요.';
  end if;
end $$;

-- 비밀번호 확인 + 실패 횟수 관리. 통과하면 해당 행을 돌려준다
create or replace function public._guestbook_verify(p_id uuid, p_password text)
returns public.guestbook
language plpgsql security definer set search_path = public, extensions as $$
declare
  r public.guestbook;
begin
  select * into r from public.guestbook where id = p_id for update;
  if not found then
    raise exception '글을 찾을 수 없습니다. 이미 삭제되었을 수 있어요.';
  end if;
  if r.locked_until is not null and r.locked_until > now() then
    raise exception '비밀번호를 여러 번 틀렸습니다. 10분 후 다시 시도해 주세요.';
  end if;
  if r.password_hash <> crypt(coalesce(p_password, ''), r.password_hash) then
    update public.guestbook
       set failed_count = case when r.failed_count + 1 >= 5 then 0 else r.failed_count + 1 end,
           locked_until = case when r.failed_count + 1 >= 5 then now() + interval '10 minutes' else null end
     where id = p_id;
    -- raise하면 위 update도 롤백되므로, 실패 정보는 반환값으로 알리고 호출부에서 예외 처리
    r.id := null;
    return r;
  end if;
  update public.guestbook set failed_count = 0, locked_until = null where id = p_id;
  return r;
end $$;


-- ---------- 공개 RPC ----------
create or replace function public.guestbook_list(p_page int default 1, p_size int default 10)
returns json
language plpgsql stable security definer set search_path = public as $$
declare
  v_size int := least(greatest(coalesce(p_size, 10), 1), 30);
  v_page int := greatest(coalesce(p_page, 1), 1);
begin
  return json_build_object(
    'items', coalesce((
      select json_agg(public._guestbook_json(g) order by g.created_at desc)
      from (
        select * from public.guestbook
        order by created_at desc
        limit v_size offset (v_page - 1) * v_size
      ) g
    ), '[]'::json),
    'total', (select count(*) from public.guestbook)
  );
end $$;

create or replace function public.guestbook_create(p_name text, p_password text, p_message text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  r public.guestbook;
begin
  perform public._guestbook_check_text(coalesce(p_name, ''), p_message);
  if char_length(coalesce(p_password, '')) not between 4 and 20 then
    raise exception '비밀번호는 4~20자로 입력해 주세요.';
  end if;

  insert into public.guestbook (name, message, password_hash)
  values (trim(p_name), trim(p_message), crypt(p_password, gen_salt('bf')))
  returning * into r;

  return public._guestbook_json(r);
end $$;

create or replace function public.guestbook_update(p_id uuid, p_password text, p_message text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  r public.guestbook;
begin
  perform public._guestbook_check_text(null, p_message);
  r := public._guestbook_verify(p_id, p_password);
  if r.id is null then
    return json_build_object('error', '비밀번호가 일치하지 않습니다.');
  end if;

  update public.guestbook
     set message = trim(p_message), updated_at = now()
   where id = p_id
  returning * into r;

  return public._guestbook_json(r);
end $$;

create or replace function public.guestbook_delete(p_id uuid, p_password text)
returns json
language plpgsql security definer set search_path = public, extensions as $$
declare
  r public.guestbook;
begin
  r := public._guestbook_verify(p_id, p_password);
  if r.id is null then
    return json_build_object('error', '비밀번호가 일치하지 않습니다.');
  end if;

  delete from public.guestbook where id = p_id;
  return json_build_object('id', p_id);
end $$;


-- ---------- 실행 권한 ----------
-- 내부 헬퍼는 외부에서 호출 금지, 공개 RPC만 anon에 허용
revoke execute on function public._guestbook_json(public.guestbook) from public, anon, authenticated;
revoke execute on function public._guestbook_check_text(text, text) from public, anon, authenticated;
revoke execute on function public._guestbook_verify(uuid, text) from public, anon, authenticated;

grant execute on function public.guestbook_list(int, int) to anon, authenticated;
grant execute on function public.guestbook_create(text, text, text) to anon, authenticated;
grant execute on function public.guestbook_update(uuid, text, text) to anon, authenticated;
grant execute on function public.guestbook_delete(uuid, text) to anon, authenticated;
