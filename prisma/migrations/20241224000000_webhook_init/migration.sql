-- CreateTable
CREATE TABLE "webhook_requests" (
    "id" SERIAL NOT NULL,
    "destination" VARCHAR(100) NOT NULL,
    "received_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_events" (
    "id" SERIAL NOT NULL,
    "request_id" INTEGER NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "mode" VARCHAR(10) NOT NULL,
    "timestamp" BIGINT NOT NULL,
    "source" JSONB NOT NULL,
    "webhook_event_id" VARCHAR(100) NOT NULL,
    "delivery_context" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "message_id" VARCHAR(50) NOT NULL,
    "message_type" VARCHAR(20) NOT NULL,
    "message" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unsend_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "unsend_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "join_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "join_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_join_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_join_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "member_leave_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "member_leave_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postback_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "postback_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_play_complete_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_play_complete_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "beacon_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "beacon_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "account_link_events" (
    "id" SERIAL NOT NULL,
    "event_id" INTEGER NOT NULL,
    "detail" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "account_link_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "webhook_events_request_id_idx" ON "webhook_events"("request_id");

-- CreateIndex
CREATE INDEX "webhook_events_type_idx" ON "webhook_events"("type");

-- CreateIndex
CREATE UNIQUE INDEX "message_events_event_id_key" ON "message_events"("event_id");

-- CreateIndex
CREATE INDEX "message_events_event_id_idx" ON "message_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "unsend_events_event_id_key" ON "unsend_events"("event_id");

-- CreateIndex
CREATE INDEX "unsend_events_event_id_idx" ON "unsend_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "follow_events_event_id_key" ON "follow_events"("event_id");

-- CreateIndex
CREATE INDEX "follow_events_event_id_idx" ON "follow_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "join_events_event_id_key" ON "join_events"("event_id");

-- CreateIndex
CREATE INDEX "join_events_event_id_idx" ON "join_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_join_events_event_id_key" ON "member_join_events"("event_id");

-- CreateIndex
CREATE INDEX "member_join_events_event_id_idx" ON "member_join_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "member_leave_events_event_id_key" ON "member_leave_events"("event_id");

-- CreateIndex
CREATE INDEX "member_leave_events_event_id_idx" ON "member_leave_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "postback_events_event_id_key" ON "postback_events"("event_id");

-- CreateIndex
CREATE INDEX "postback_events_event_id_idx" ON "postback_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_play_complete_events_event_id_key" ON "video_play_complete_events"("event_id");

-- CreateIndex
CREATE INDEX "video_play_complete_events_event_id_idx" ON "video_play_complete_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "beacon_events_event_id_key" ON "beacon_events"("event_id");

-- CreateIndex
CREATE INDEX "beacon_events_event_id_idx" ON "beacon_events"("event_id");

-- CreateIndex
CREATE UNIQUE INDEX "account_link_events_event_id_key" ON "account_link_events"("event_id");

-- CreateIndex
CREATE INDEX "account_link_events_event_id_idx" ON "account_link_events"("event_id");

-- AddForeignKey
ALTER TABLE "webhook_events" ADD CONSTRAINT "webhook_events_request_id_fkey" FOREIGN KEY ("request_id") REFERENCES "webhook_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message_events" ADD CONSTRAINT "message_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unsend_events" ADD CONSTRAINT "unsend_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow_events" ADD CONSTRAINT "follow_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "join_events" ADD CONSTRAINT "join_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_join_events" ADD CONSTRAINT "member_join_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "member_leave_events" ADD CONSTRAINT "member_leave_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "postback_events" ADD CONSTRAINT "postback_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video_play_complete_events" ADD CONSTRAINT "video_play_complete_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beacon_events" ADD CONSTRAINT "beacon_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "account_link_events" ADD CONSTRAINT "account_link_events_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "webhook_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;
