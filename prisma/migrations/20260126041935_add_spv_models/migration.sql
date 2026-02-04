-- CreateTable
CREATE TABLE "spvs" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "lead_investor_id" TEXT NOT NULL,
    "target_amount" DECIMAL(15,2) NOT NULL,
    "carry_percentage" DECIMAL(5,2) NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'forming',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "spv_members" (
    "id" TEXT NOT NULL,
    "spv_id" TEXT NOT NULL,
    "investor_id" TEXT NOT NULL,
    "commitment_amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'invited',
    "joined_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spv_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "spv_members_spv_id_investor_id_key" ON "spv_members"("spv_id", "investor_id");

-- AddForeignKey
ALTER TABLE "spvs" ADD CONSTRAINT "spvs_lead_investor_id_fkey" FOREIGN KEY ("lead_investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spv_members" ADD CONSTRAINT "spv_members_spv_id_fkey" FOREIGN KEY ("spv_id") REFERENCES "spvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "spv_members" ADD CONSTRAINT "spv_members_investor_id_fkey" FOREIGN KEY ("investor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
