-- Migration: add contact_inquiry_replies table for threaded discussion
CREATE TABLE IF NOT EXISTS "contact_inquiry_replies"
(
    "id"         text PRIMARY KEY         NOT NULL,
    "inquiry_id" text                     NOT NULL REFERENCES "contact_inquiries" ("id") ON DELETE CASCADE,
    "body"       text                     NOT NULL,
    "sent_at"    timestamp with time zone NOT NULL DEFAULT now()
);
