const delay = require("delay");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const GLang = require("../../plugins/schemas/language.js")
const db = require("../../plugins/schemas/autoreconnect")

module.exports = async (client, oldState, newState) => {
	let data = await db.findOne({ guild: newState.guild.id })

	if(oldState.channel === null && oldState.id !== client.user.id) {
		if (client.websocket) client.websocket.send(JSON.stringify({ guild: newState.guild.id, op: 12 }))
	}
	if (newState.channel === null && newState.id !== client.user.id) {
		if (client.websocket) client.websocket.send(JSON.stringify({ guild: newState.guild.id, op: 13 }))
	}
	
	let guildModel = await GLang.findOne({
		guild: newState.guild.id,
	});
	if (!guildModel) {
		guildModel = await GLang.create({
			guild: newState.guild.id,
			language: "en",
		});
	}
	const { language } = guildModel;

	const player = client.manager?.players.get(newState.guild.id);
	if (!player) return;

	if (!newState.guild.members.cache.get(client.user.id).voice.channelId) player.destroy();

	if (newState.channelId && newState.channel.type == "GUILD_STAGE_VOICE" && newState.guild.members.me.voice.suppress) {
		if (newState.guild.members.me.permissions.has(PermissionsBitField.Flags.Connect) || (newState.channel && newState.channel.permissionsFor(nS.guild.members.me).has(PermissionsBitField.Flags.Speak))) {
			newState.guild.members.me.voice.setSuppressed(false);
		}
	}

	if (oldState.id === client.user.id) return;
	if (!oldState.guild.members.cache.get(client.user.id).voice.channelId) return;

	if (data) return;

	const vcRoom = oldState.guild.members.me.voice.channel.id;

	const leaveEmbed = client.channels.cache.get(player.textId);

	if (oldState.guild.members.cache.get(client.user.id).voice.channelId === oldState.channelId) {
		if (oldState.guild.members.me.voice?.channel && oldState.guild.members.me.voice.channel.members.filter((m) => !m.user.bot).size === 0) {

				await delay(100);

				const vcMembers = oldState.guild.members.me.voice.channel?.members.size;
				if (!vcMembers || vcMembers === 1) {
				const newPlayer = client.manager?.players.get(newState.guild.id)
				newPlayer ? player.destroy() : oldState.guild.members.me.voice.channel.leave();
				const TimeoutEmbed = new EmbedBuilder()
					.setDescription(`${client.i18n.get(language, "player", "player_end", { 
						leave: vcRoom
					})}`)
					.setColor(client.color)
				try {
		      if (leaveEmbed) leaveEmbed.send({ embeds: [TimeoutEmbed] });
		    } catch (error) {
		      console.log(error);
		    }
			}
		}
	}
};