module.exports = {
  name: "add",
  run: async (client, json, ws) => {
    let webqueue = []
    if (!json.user) return ws.send(JSON.stringify({ error: "0x115", message: "No user's id provided" }))
    if (!json.guild) return ws.send(JSON.stringify({ error: "0x120", message: "No guild's id provided" }))
    if (json.tracks && json.query) return ws.send(JSON.stringify({ error: "0x110", message: "Only 1 - 2 params" }))

    const Guild = client.guilds.cache.get(json.guild);
    const Member = Guild.members.cache.get(json.user);

    const player = await client.manager.createPlayer({
      guildId: Guild.id,
      voiceId: Member.voice.channel.id,
      deaf: true,
    });

    if (json.tracks) {
      const res = await player.search(json.tracks[0].uri, { requester: Member })
      if (player.playing) for (let track of res.tracks) player.queue.add(track)
      else player.play(res.tracks[0]);
      if (!player.playing) await player.play();

      player.queue.forEach(track => {
        webqueue.push(
          {
            title: track.title,
            uri: track.uri,
            length: track.length,
            thumbnail: track.thumbnail,
            author: track.author,
            requester: track.requester // Just case can push
          }
        )
      })

      const song = player.queue.current

      ws.send(JSON.stringify({ 
        op: 2, 
        guild: json.guild, 
        current: {
          title: song.title,
          uri: song.uri,
          length: song.length,
          thumbnail: song.thumbnail,
          author: song.author,
          requester: song.requester
        }, 
        queue: webqueue 
      }))
      
      return client.logger.info(`Added player tracks via websockets [tracks params] @ ${json.guild}`)
    } else if (json.query) {
      const res = await player.search(json.query, { requester: Member })
      if (res.type === 'PLAYLIST' || res.type === 'SEARCH') for (let track of res.tracks) player.queue.add(track)

      if (!player.playing && !player.paused) player.play();

      player.queue.forEach(track => {
        webqueue.push(
          {
            title: track.title,
            uri: track.uri,
            length: track.length,
            thumbnail: track.thumbnail,
            author: track.author,
            requester: track.requester // Just case can push
          }
        )
      })

      const song = player.queue.current

      ws.send(JSON.stringify({ 
        op: 2, 
        guild: json.guild, 
        current: {
          title: song.title,
          uri: song.uri,
          length: song.length,
          thumbnail: song.thumbnail,
          author: song.author,
          requester: song.requester
        }, 
        queue: webqueue 
      }))
      
      client.logger.info(`Added player tracks via websockets [query params] @ ${json.guild}`)
    }
  }
}