import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';

let ssmClient;

const getSSMClient = () => {
  if (ssmClient) return ssmClient;
  const region =
    process.env.AWS_REGION ||
    process.env.AWS_DEFAULT_REGION ||
    process.env.REGION;
  if (!region) {
    console.error('AWS region is not defined; cannot initialize SSM client');
    return null;
  }
  ssmClient = new SSMClient({ region });
  return ssmClient;
};

const buildParameterNames = (name) => {
  const explicit = process.env[`${name}_SSM_PATH`];
  const paths = [];
  if (explicit) paths.push(explicit);

  const appId =
    process.env.AMPLIFY_APP_ID ||
    process.env.AMPLIFY_APPID ||
    process.env.APP_ID;
  if (!appId) {
    console.error(`AMPLIFY_APP_ID is not defined; cannot derive SSM path for ${name}`);
    return paths;
  }
  const branch =
    process.env.AMPLIFY_BRANCH ||
    process.env.AMPLIFY_BRANCH_NAME ||
    process.env.BRANCH ||
    'main';
  paths.push(`/amplify/${appId}/${branch}/${name}`);
  paths.push(`/amplify/shared/${appId}/${name}`);
  return paths;
};

export const getSecretValue = async (name) => {
  if (!name) return undefined;
  if (process.env[name]) return process.env[name];

  const parameterNames = buildParameterNames(name);
  if (!parameterNames.length) {
    console.error(`Unable to determine any SSM paths for ${name}`);
    return undefined;
  }

  const client = getSSMClient();
  if (!client) {
    console.error(`SSM client is not available when resolving ${name}`);
    return undefined;
  }

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
        console.warn(`Parameter ${parameterName} was not found for ${name}`);
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
