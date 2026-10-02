-- Project tasks stay on the project board until explicitly added to the Tasks tab.
ALTER TABLE "StudioTask" ADD COLUMN "onTaskList" BOOLEAN NOT NULL DEFAULT false;
