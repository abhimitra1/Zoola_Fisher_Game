-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "guest_token" TEXT,
    "display_name" TEXT,
    "custodial_wallet" TEXT,
    "player_level" INTEGER NOT NULL DEFAULT 1,
    "total_xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 100,
    "pearls" INTEGER NOT NULL DEFAULT 0,
    "essence" INTEGER NOT NULL DEFAULT 0,
    "zoola_balance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_login" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "tank_name" TEXT,
    "tank_type" TEXT NOT NULL DEFAULT 'basic',
    "oxygen_level" INTEGER NOT NULL DEFAULT 70,
    "cleanliness" INTEGER NOT NULL DEFAULT 100,
    "size" INTEGER NOT NULL DEFAULT 1,
    "theme_skin" TEXT,
    "frame_cosmetic" TEXT,
    "last_dirt_tick" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_o2_tick" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tanks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fish" (
    "id" TEXT NOT NULL,
    "tank_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "species" TEXT NOT NULL,
    "rarity" TEXT NOT NULL,
    "hunger" INTEGER NOT NULL DEFAULT 80,
    "health" INTEGER NOT NULL DEFAULT 100,
    "growth_progress" INTEGER NOT NULL DEFAULT 0,
    "growth_stage" TEXT NOT NULL DEFAULT 'egg',
    "mood" INTEGER NOT NULL DEFAULT 80,
    "hatched_at" TIMESTAMP(3),
    "matured_at" TIMESTAMP(3),
    "sell_value" INTEGER,
    "trait" TEXT,
    "last_fed" TIMESTAMP(3),
    "alive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "fish_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inventory" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "item_type" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "nft_token_id" TEXT,
    "nft_contract" TEXT,
    "is_equipped" BOOLEAN NOT NULL DEFAULT false,
    "acquired_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tx_queue" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tx_hash" TEXT,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMP(3),

    CONSTRAINT "tx_queue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "device_info" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analytics_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "properties" JSONB,
    "client_version" TEXT,
    "session_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_guest_token_key" ON "users"("guest_token");

-- CreateIndex
CREATE UNIQUE INDEX "tx_queue_idempotency_key_key" ON "tx_queue"("idempotency_key");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- AddForeignKey
ALTER TABLE "tanks" ADD CONSTRAINT "tanks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish" ADD CONSTRAINT "fish_tank_id_fkey" FOREIGN KEY ("tank_id") REFERENCES "tanks"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fish" ADD CONSTRAINT "fish_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inventory" ADD CONSTRAINT "inventory_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tx_queue" ADD CONSTRAINT "tx_queue_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
