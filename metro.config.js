const { getDefaultConfig } = require('expo/metro-config');
const { resolve } = require('path');

const projectRoot = __dirname;

const config = getDefaultConfig(projectRoot);

const webMock = resolve(projectRoot, '__mocks__/expo-media-library.web.ts');

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-media-library' && platform === 'web') {
    return {
      filePath: webMock,
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
