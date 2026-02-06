export default {
  '/api/auth_routes': {
    '/form/advanced-form': { authority: ['admin', 'user'] },
  },
  'GET /api/auth_routes': {
    '/user': { path: '/user', component: '../layouts/UserLayout' },
  },
};
