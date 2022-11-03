const { EmbedBuilder, ApplicationCommandOptionType, PermissionsBitField } = require('discord.js');
const Setup = require('../../plugins/schemas/setup.js')
module.exports = { 
  name: ["settings", "setup"],
  description: "Setup channel song request",
  categories: "Utils",
  options: [
      {
          name: "type",
          description: "Type of channel",
          type: ApplicationCommandOptionType.String,
          required: true,
          choices: [
              {
                  name: "Create",
                  value: "create"
              },
              {
                  name: "Delete",
                  value: "delete"
              }
          ]
      },
  ],
run: async (interaction, client, language) => {
        await interaction.deferReply({ ephemeral: false });
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return interaction.editReply(`${client.i18n.get(language, "utilities", "lang_perm")}`);
            if(interaction.options.getString('type') === "create") {
                // Create voice
                await interaction.guild.channels.create({
                    name: "song-request",
                    type: 0, // 0 = text, 2 = voice
                    topic: `${client.i18n.get(language, "setup", "setup_topic")}`,
                    parent_id: interaction.channel.parentId,
                    user_limit: 3,
                    rate_limit_per_user: 3, 
                }).then(async (channel) => {

                    const queueMsg = `${client.i18n.get(language, "setup", "setup_queuemsg")}`;

                    const playEmbed = new EmbedBuilder()
                        .setColor(client.color)
                        .setAuthor({ name: `${client.i18n.get(language, "setup", "setup_playembed_author")}` })
                        .setImage(`https://cdn.discordapp.com/avatars/${client.user.id}/${client.user.avatar}.jpeg?size=300`)
                        .setDescription(`${client.i18n.get(language, "setup", "setup_playembed_desc")}`)
                        .setFooter({ text: `${client.i18n.get(language, "setup", "setup_playembed_footer")}` });

                        await channel.send({ content: `${queueMsg}`, embeds: [playEmbed], components: [client.diSwitch] }).then(async (playmsg) => {
                            await Setup.findOneAndUpdate({ guild: interaction.guild.id }, {
                                guild: interaction.guild.id,
                                enable: true,
                                channel: channel.id,
                                playmsg: playmsg.id,
                            }, { upsert: true, new: true });

                            const embed = new EmbedBuilder()
                                .setDescription(`${client.i18n.get(language, "setup", "setup_msg", {
                                    channel: channel,
                                })}`)
                                .setColor(client.color);
                                return interaction.followUp({ embeds: [embed] });
                            })
                        });
                    }
                if(interaction.options.getString('type') === "delete") {
                    const SetupChannel = await Setup.findOne({ guild: interaction.guild.id });
                    const fetchedChannel = interaction.guild.channels.cache.get(SetupChannel.channel);
                    await fetchedChannel.delete();

                    await Setup.findOneAndUpdate({ guild: interaction.guild.id }, {
                            guild: interaction.guild.id,
                            enable: false,
                            channel: "",
                            playmsg: "",
                        });
                        
                    const embed = new EmbedBuilder()
                        .setDescription(`${client.i18n.get(language, "setup", "setup_deleted")}`)
                        .setColor(client.color);

                    return interaction.editReply({ embeds: [embed] });
        }
    }
};