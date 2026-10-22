async function destroyUserSessions(redisClient, userId) {
  let destroyedCount = 0;

  const sessionPrefix = process.env.SESSION_PREFIX;

  for await (const key of redisClient.scanIterator({
    MATCH: `${sessionPrefix}*`,
    COUNT: 100,
  })) {
    const keys = Array.isArray(key) ? key : [key];

    for (const sessionKey of keys) {
      const sessionData = await redisClient.get(sessionKey);

      if (!sessionData) {
        continue;
      }

      let session;

      try {
        session = JSON.parse(sessionData);
      } catch (error) {
        console.error(
          `Sessão inválida no Redis (${sessionKey}):`,
          error.message
        );
        continue;
      }

      const sessionUserId = Number(session.user?.id);

      if (
        Number.isFinite(sessionUserId) &&
        sessionUserId === Number(userId)
      ) {
        await redisClient.del(sessionKey);
        destroyedCount++;
      }
    }
  }

  return destroyedCount;
}

module.exports = { destroyUserSessions };