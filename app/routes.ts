import { type RouteConfig, index, route } from '@react-router/dev/routes'

export default [
  index('routes/home.tsx'),
  route('health/db', 'routes/health.db.tsx'),
  route('api/auth/*', 'routes/api.auth.$.tsx'),
  route('api/__test__/premium', 'routes/api.__test__.premium.tsx'),
  route('api/favicon/ico', 'routes/api.favicon.ico.tsx'),
  route('auth/signup', 'routes/auth.signup.tsx'),
  route('auth/login', 'routes/auth.login.tsx'),
  route('upload', 'routes/upload.tsx'),
  route('preview', 'routes/preview.tsx'),
] satisfies RouteConfig
