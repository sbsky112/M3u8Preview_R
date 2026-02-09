-- CreateIndex
CREATE INDEX "favorites_userId_createdAt_idx" ON "favorites"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "import_logs_userId_idx" ON "import_logs"("userId");

-- CreateIndex
CREATE INDEX "import_logs_createdAt_idx" ON "import_logs"("createdAt");

-- CreateIndex
CREATE INDEX "media_status_createdAt_idx" ON "media"("status", "createdAt");

-- CreateIndex
CREATE INDEX "media_categoryId_idx" ON "media"("categoryId");

-- CreateIndex
CREATE INDEX "media_views_idx" ON "media"("views");

-- CreateIndex
CREATE INDEX "media_tags_tagId_idx" ON "media_tags"("tagId");

-- CreateIndex
CREATE INDEX "playlist_items_playlistId_idx" ON "playlist_items"("playlistId");

-- CreateIndex
CREATE INDEX "playlists_userId_idx" ON "playlists"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "watch_history_userId_updatedAt_idx" ON "watch_history"("userId", "updatedAt");
