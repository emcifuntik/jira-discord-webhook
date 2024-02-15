import express from 'express';
import bodyParser from 'body-parser';
import got from 'got';
import 'dotenv/config';

const app = express();

app.use(bodyParser.json());

const routeSecret = process.env.WEBHOOK_ROUTE_SECRET;

app.post('/webhook/' + routeSecret, async (req, res) => {
  const jiraPayload = req.body;
  const fields = [
    {
      name: 'Issue key',
      value: jiraPayload.issue.key,
    },
    {
      name: 'Summary',
      value: jiraPayload.issue.fields.summary,
    }
  ];

  if (jiraPayload.changelog) {
    fields.push({
      name: jiraPayload.changelog.items[0].field + ' changed',
      value: jiraPayload.changelog.items[0].fromString + ' -> ' + jiraPayload.changelog.items[0].toString
    });
  }

  let message = {
    username: 'Jira Bot',
    embeds: [
      {
        title: 'New event from Jira',
        description: `Event type: ${jiraPayload.webhookEvent}`,
        fields,
        author: {
          name: jiraPayload.user.displayName,
          url: jiraPayload.user.self,
          icon_url: jiraPayload.user.avatarUrls['48x48'],
        },
      },
    ],
  };

  try {
    await got.post(process.env.DISCORD_WEBHOOK_URL, {
      json: message,
      responseType: 'json',
    });
  } catch (error) {
    console.error('Error sending message to Discord', error);
  }

  res.sendStatus(200);
});

const port = +process.env.PORT;

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
