alter table if exists public.event_inquiries
  add column if not exists follow_up_details_json jsonb not null default '{}'::jsonb;

update public.event_inquiries
set follow_up_details_json = jsonb_strip_nulls(
  jsonb_build_object(
    'selected_styles',
    case
      when inspiration_notes ~ '(?:^|\n\n)Style direction:\s*'
      then to_jsonb(
        regexp_split_to_array(
          trim(
            both ' '
            from coalesce(
              (regexp_match(
                inspiration_notes,
                '(?:^|\n\n)Style direction:\s*([\s\S]*?)(?=\n\n[A-Za-z][^\n]*:\s|$)'
              ))[1],
              ''
            )
          ),
          '\s*,\s*'
        )
      )
      else null
    end,
    'inspiration_links',
    case
      when inspiration_notes ~ '(?:^|\n\n)Inspiration links:\s*'
      then to_jsonb(
        regexp_split_to_array(
          trim(
            both E'\n '
            from coalesce(
              (regexp_match(
                inspiration_notes,
                '(?:^|\n\n)Inspiration links:\s*([\s\S]*?)(?=\n\n[A-Za-z][^\n]*:\s|$)'
              ))[1],
              ''
            )
          ),
          E'\n+'
        )
      )
      else null
    end,
    'uploaded_urls',
    case
      when coalesce(array_length(vision_board_urls, 1), 0) > 0
       and (
         additional_info ~ '(?:^|\n\n)Follow-up:\s*'
         or inspiration_notes ~ '(?:^|\n\n)Style direction:\s*'
         or inspiration_notes ~ '(?:^|\n\n)Inspiration links:\s*'
       )
      then to_jsonb(vision_board_urls)
      else null
    end,
    'note',
    case
      when additional_info ~ '(?:^|\n\n)Follow-up:\s*'
      then trim(
        both ' '
        from coalesce(
          (regexp_match(
            additional_info,
            '(?:^|\n\n)Follow-up:\s*([\s\S]*?)(?=\n\n[A-Za-z][^\n]*:\s|$)'
          ))[1],
          ''
        )
      )
      else null
    end
  )
)
where coalesce(follow_up_details_json, '{}'::jsonb) = '{}'::jsonb
  and (
    additional_info ~ '(?:^|\n\n)Follow-up:\s*'
    or inspiration_notes ~ '(?:^|\n\n)Style direction:\s*'
    or inspiration_notes ~ '(?:^|\n\n)Inspiration links:\s*'
  );
