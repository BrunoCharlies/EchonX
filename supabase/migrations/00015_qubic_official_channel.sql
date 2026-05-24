-- Official Qubic channel: X mirror (@_Qubic_), slot `qubic`, free to follow.

alter table public.official_channels drop constraint if exists official_channels_slot_check;

alter table public.official_channels
  add constraint official_channels_slot_check
  check (slot in ('news', 'echonx', 'qubic'));
