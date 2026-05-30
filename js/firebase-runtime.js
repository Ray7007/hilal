(function () {
  const scriptUrl =
    document.currentScript?.src || new URL("js/firebase-runtime.js", location.href).href;
  const authModuleUrl = new URL("../src/firebase/auth.js", scriptUrl).href;
  const databaseModuleUrl = new URL("../src/firebase/database.js", scriptUrl).href;

  let authModulePromise;
  let databaseModulePromise;

  function loadAuthModule() {
    if (!authModulePromise) authModulePromise = import(authModuleUrl);
    return authModulePromise;
  }

  function loadDatabaseModule() {
    if (!databaseModulePromise) databaseModulePromise = import(databaseModuleUrl);
    return databaseModulePromise;
  }

  async function callAuth(name, ...args) {
    const module = await loadAuthModule();
    return module[name](...args);
  }

  async function callDatabase(name, ...args) {
    const module = await loadDatabaseModule();
    return module[name](...args);
  }

  window.firebaseRuntime = {
    loginCoach: (email, password) => callAuth("loginCoach", email, password),
    loginAdmin: (email, password) => callAuth("loginAdmin", email, password),
    logoutCoach: () => callAuth("logoutCoach"),
    resetPassword: (email) => callAuth("resetPassword", email),
    addPlayer: (player) => callDatabase("addPlayer", player),
    getPlayers: (filters) => callDatabase("getPlayers", filters),
    getAllPlayers: (filters) => callDatabase("getAllPlayers", filters),
    updatePlayer: (playerId, player) =>
      callDatabase("updatePlayer", playerId, player),
    deletePlayer: (playerId) => callDatabase("deletePlayer", playerId),
    updatePlayerNote: (playerId, note) =>
      callDatabase("updatePlayerNote", playerId, note),
    updateAttendance: (attendance) =>
      callDatabase("updateAttendance", attendance),
    getAttendance: (date) => callDatabase("getAttendance", date),
    getAttendanceRecords: (filters) =>
      callDatabase("getAttendanceRecords", filters),
    saveSchedule: (schedule) => callDatabase("saveSchedule", schedule),
    getSchedule: (id) => callDatabase("getSchedule", id),
    addDailyWorkout: (workout) => callDatabase("addDailyWorkout", workout),
    getDailyWorkouts: (filters) => callDatabase("getDailyWorkouts", filters),
    deleteDailyWorkout: (workoutId) =>
      callDatabase("deleteDailyWorkout", workoutId),
    saveSportSettings: (sport) => callDatabase("saveSportSettings", sport),
    getSportSettings: (sportId) => callDatabase("getSportSettings", sportId),
    getSports: (filters) => callDatabase("getSports", filters),
    addSport: (sport) => callDatabase("addSport", sport),
    updateSport: (sportId, sport) =>
      callDatabase("updateSport", sportId, sport),
    deleteSport: (sportId) => callDatabase("deleteSport", sportId),
    getCoaches: (filters) => callDatabase("getCoaches", filters),
    addCoach: (coach) => callDatabase("addCoach", coach),
    updateCoach: (coachId, coach) =>
      callDatabase("updateCoach", coachId, coach),
    getAdminProfile: (user) => callDatabase("getAdminProfile", user),
    isAdminUser: (user) => callDatabase("isAdminUser", user),
    getReportsSummary: (filters) => callDatabase("getReportsSummary", filters),
    getAppSettings: () => callDatabase("getAppSettings"),
    updateAppSettings: (settings) =>
      callDatabase("updateAppSettings", settings),
  };

  window.loginCoachWithFirebase = window.firebaseRuntime.loginCoach;
  window.addPlayerToFirestore = window.firebaseRuntime.addPlayer;
})();
