-- AlterTable
ALTER TABLE "User" ADD COLUMN     "phone" TEXT,
ADD COLUMN     "profileImageUrl" TEXT,
ADD COLUMN     "shareReports" BOOLEAN DEFAULT true;

-- CreateTable
CREATE TABLE "Availability" (
    "id" TEXT NOT NULL,
    "counsellorId" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ(6) NOT NULL,
    "endTime" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "Availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "counsellorId" TEXT NOT NULL,
    "startTime" TIMESTAMPTZ(6) NOT NULL,
    "endTime" TIMESTAMPTZ(6) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Assignment" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "counsellorId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Assignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "counsellorId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "emotion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_avail_counsellor_start" ON "Availability"("counsellorId", "startTime");

-- CreateIndex
CREATE INDEX "idx_meeting_counsellor_start" ON "Meeting"("counsellorId", "startTime");

-- CreateIndex
CREATE INDEX "idx_meeting_student_start" ON "Meeting"("studentId", "startTime");

-- CreateIndex
CREATE INDEX "idx_activity_user_created" ON "ActivityLog"("userId", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "uniq_assignment_student" ON "Assignment"("studentId");

-- CreateIndex
CREATE INDEX "idx_assignment_counsellor" ON "Assignment"("counsellorId");

-- CreateIndex
CREATE INDEX "idx_convo_counsellor" ON "Conversation"("counsellorId");

-- CreateIndex
CREATE UNIQUE INDEX "uniq_convo_student_counsellor" ON "Conversation"("studentId", "counsellorId");

-- CreateIndex
CREATE INDEX "idx_message_convo_created" ON "Message"("conversationId", "createdAt");

-- CreateIndex
CREATE INDEX "Prediction_createdAt_idx" ON "Prediction"("createdAt");

-- CreateIndex
CREATE INDEX "Prediction_studentId_idx" ON "Prediction"("studentId");

-- AddForeignKey
ALTER TABLE "Availability" ADD CONSTRAINT "Availability_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Assignment" ADD CONSTRAINT "Assignment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_counsellorId_fkey" FOREIGN KEY ("counsellorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
