-- ISO 14732:2025 — add enum value (must run before tables that use it)

alter type welding_standard add value if not exists 'ISO_14732';
