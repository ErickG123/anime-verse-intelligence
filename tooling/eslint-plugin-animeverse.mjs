import path from 'node:path';

function normalizePath(filePath) {
  return filePath.split(path.sep).join('/');
}

const noInlineComponentAssets = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow inline template/styles and require ChangeDetectionStrategy.OnPush in Angular @Component decorators',
    },
    schema: [],
  },
  create(context) {
    return {
      Decorator(node) {
        const expr = node.expression;
        if (
          !expr ||
          expr.type !== 'CallExpression' ||
          expr.callee.type !== 'Identifier' ||
          expr.callee.name !== 'Component'
        ) {
          return;
        }
        const arg = expr.arguments[0];
        if (!arg || arg.type !== 'ObjectExpression') return;

        let hasOnPush = false;
        for (const prop of arg.properties) {
          if (prop.type !== 'Property' || prop.key.type !== 'Identifier') continue;
          if (prop.key.name === 'template') {
            context.report({
              node: prop,
              message: 'Inline "template:" is forbidden. Use "templateUrl" with a separate .html file.',
            });
          }
          if (prop.key.name === 'styles') {
            context.report({
              node: prop,
              message: 'Inline "styles:" is forbidden. Use "styleUrl" with a separate .scss file.',
            });
          }
          if (
            prop.key.name === 'changeDetection' &&
            prop.value.type === 'MemberExpression' &&
            prop.value.property.type === 'Identifier' &&
            prop.value.property.name === 'OnPush'
          ) {
            hasOnPush = true;
          }
        }

        if (!hasOnPush) {
          context.report({
            node: arg,
            message: 'Angular @Component must declare "changeDetection: ChangeDetectionStrategy.OnPush".',
          });
        }
      },
    };
  },
};

const noDomainExportsInComponentsOrServices = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow exporting interfaces, type aliases, enums, or domain constants from Angular component/service/interceptor files',
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.filename);
    const isRestrictedFile =
      filename.includes('apps/web/src/app/') &&
      (filename.endsWith('.component.ts') ||
        filename.endsWith('.service.ts') ||
        filename.endsWith('.interceptor.ts') ||
        filename.endsWith('/app.ts'));

    if (!isRestrictedFile) return {};

    return {
      ExportNamedDeclaration(node) {
        if (!node.declaration) return;
        const declType = node.declaration.type;
        if (
          declType === 'TSInterfaceDeclaration' ||
          declType === 'TSTypeAliasDeclaration' ||
          declType === 'TSEnumDeclaration'
        ) {
          context.report({
            node,
            message:
              'Do not export interfaces, types, or enums from component/service/interceptor files. Move them to .model.ts, .types.ts, or .enum.ts.',
          });
        }
        if (declType === 'VariableDeclaration' && !filename.endsWith('.interceptor.ts')) {
          context.report({
            node,
            message:
              'Do not export domain constants from component/service files. Move them to a .constants.ts file.',
          });
        }
      },
    };
  },
};

const enforceFeatureBoundaries = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce frontend feature-based dependency boundaries (core/shared cannot import features; features cannot import other features)',
    },
    schema: [],
  },
  create(context) {
    const filename = normalizePath(context.filename);
    if (!filename.includes('apps/web/src/app/')) return {};

    const inCore = filename.includes('apps/web/src/app/core/');
    const inShared = filename.includes('apps/web/src/app/shared/');
    const featureMatch = filename.match(/apps\/web\/src\/app\/features\/([^/]+)\//);
    const currentFeature = featureMatch ? featureMatch[1] : null;

    return {
      ImportDeclaration(node) {
        const source = String(node.source.value);

        if ((inCore || inShared) && (source.startsWith('@features/') || source.includes('/features/'))) {
          context.report({
            node,
            message: `${inCore ? 'core/' : 'shared/'} must not import from features/ ("${source}").`,
          });
          return;
        }

        if (currentFeature) {
          const aliasMatch = source.match(/^@features\/([^/]+)\//);
          if (aliasMatch && aliasMatch[1] !== currentFeature) {
            context.report({
              node,
              message: `Feature "${currentFeature}" must not directly import from another feature "${aliasMatch[1]}" ("${source}").`,
            });
          }
        }
      },
    };
  },
};

export default {
  rules: {
    'no-inline-component-assets': noInlineComponentAssets,
    'no-domain-exports-in-components-or-services': noDomainExportsInComponentsOrServices,
    'enforce-feature-boundaries': enforceFeatureBoundaries,
  },
};
