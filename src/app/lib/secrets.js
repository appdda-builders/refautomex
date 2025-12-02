import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

let ssmClient;

const getSSMClient = () => {
  if (ssmClient) return ssmClient;
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  if (!region) return null;
  ssmClient = new SSMClient({ region });
  return ssmClient;
};

const buildParameterNames = (name) => {
  const appId = process.env.AMPLIFY_APP_ID;
  if (!appId) return [];
  const branch =
    process.env.AMPLIFY_BRANCH ||
    process.env.AMPLIFY_BRANCH_NAME ||
    process.env.BRANCH ||
    'main';
  return [
    `/amplify/${appId}/${branch}/${name}`,
    `/amplify/shared/${appId}/${name}`,
  ];
};

export const getSecretValue = async (name) => {
  if (!name) return undefined;
  if (process.env[name]) return process.env[name];

  const parameterNames = buildParameterNames(name);
  if (!parameterNames.length) return undefined;

  const client = getSSMClient();
  if (!client) return undefined;

  for (const parameterName of parameterNames) {
    try {
      const response = await client.send(
        new GetParameterCommand({
          Name: parameterName,
          WithDecryption: true,
        })
      );
      const value = response.Parameter?.Value;
      if (value) {
        process.env[name] = value;
        return value;
      }
    } catch (error) {
      if (error.name === 'ParameterNotFound') {
        continue;
      }
      console.error(`Failed to fetch ${name} from ${parameterName}:`, error);
      break;
    }
  }

  console.error(`Secret ${name} is not configured in SSM or environment variables`);
  return undefined;
};

export default getSecretValue;
