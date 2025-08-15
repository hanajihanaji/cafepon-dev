import { lazy } from 'react';

const MenuOrderPage = lazy(() => import('./menu-order'));

const App = {
  bootstrap() {},
  register(app: any) {
    app.addMenuLink({
      to: '/menu-order',
      icon: () => '🔄',
      intlLabel: {
        id: 'menu-order.plugin.name',
        defaultMessage: 'メニュー順序管理',
      },
      Component: MenuOrderPage,
      permissions: [],
    });

    app.createSettingLink(
      'menu-order',
      {
        intlLabel: {
          id: 'menu-order.plugin.name',
          defaultMessage: 'メニュー順序管理',
        },
        id: 'menu-order',
        to: '/menu-order',
      }
    );
  },
};

export default App;