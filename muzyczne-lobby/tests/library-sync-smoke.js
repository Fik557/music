"use strict";

const fs = require("fs");
const os = require("os");
const path = require("path");

const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "anime-library-sync-"));

process.env.DATA_DIR = dataDir;
process.env.DISABLE_SQLITE = "1";
process.env.DATABASE_URL = "";
process.env.NODE_ENV = "test";
process.env.PORT = "0";

const server = require("../server.js");

server.ready.then(function () {
  const fixtureTrack = {
    id: "track_existing",
    anime: "Attack on Titan Season 2 / Shingeki no Kyojin Season 2",
    opening: "Opening 1",
    difficulty: "medium",
    audioUrl: "https://www.youtube.com/watch?v=CID-sYQNCew",
    startAtFirst: 0,
    startAtSecond: 51
  };
  const room = {
    libraryTracks: server.testApi.restoreTracks([fixtureTrack]),
    tracks: server.testApi.restoreTracks([Object.assign({}, fixtureTrack, { startAtSecond: 50 })])
  };
  const libraryTrack = room.libraryTracks.find(function (track) {
    return track.videoId === "CID-sYQNCew";
  });
  const mainTrackBefore = room.tracks.find(function (track) {
    return track.videoId === "CID-sYQNCew";
  });
  if (!libraryTrack || !mainTrackBefore) throw new Error("Fixture track was not found.");
  if (libraryTrack.startAtSecond === mainTrackBefore.startAtSecond) {
    throw new Error("Fixture must begin with different library and Openingi values.");
  }

  const error = server.testApi.updateLibraryTrack(room, {
    trackId: libraryTrack.id,
    track: Object.assign({}, libraryTrack, {
      anime: "Attack on Titan 2 / Shingeki no Kyojin Season 2",
      startAtSecond: 52
    })
  });
  if (error) throw new Error(error);

  const libraryTrackAfter = room.libraryTracks.find(function (track) {
    return track.id === libraryTrack.id;
  });
  const mainTrackAfter = room.tracks.find(function (track) {
    return track.videoId === "CID-sYQNCew";
  });
  if (!libraryTrackAfter || libraryTrackAfter.startAtSecond !== 52) {
    throw new Error("Library value was not updated.");
  }
  if (!mainTrackAfter || mainTrackAfter.startAtSecond !== 52 || mainTrackAfter.anime !== libraryTrackAfter.anime) {
    throw new Error("Openingi value was not synchronized.");
  }
  if (mainTrackAfter.libraryTrackId !== libraryTrackAfter.id) {
    throw new Error("Permanent library link was not created.");
  }

  server.close(function () {
    console.log("Library edit synced to Openingi.");
    process.exit(0);
  });
}).catch(function (error) {
  console.error(error.message || error);
  process.exit(1);
});
