-- Allow plain-text recommendations (e.g. Qubic whitepaper .txt) in recommended-documents bucket.

update storage.buckets
set allowed_mime_types = array[
  'application/pdf',
  'text/plain',
  'image/jpeg',
  'image/png',
  'image/webp'
]::text[]
where id = 'recommended-documents';
