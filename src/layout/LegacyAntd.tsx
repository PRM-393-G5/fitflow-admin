import { App as AntApp, ConfigProvider, theme as antTheme } from 'antd';
import { Outlet } from 'react-router';
import { useTheme } from '../theme/context';
import { BRAND_COLOR } from '../theme/brand';

/**
 * antd, in the current theme, around the pages not yet moved to HeroUI.
 * Scoped to them so its global link and reset styles stay off the shell.
 */
export function LegacyAntd() {
  const { resolved } = useTheme();
  const dark = resolved === 'dark';
  return (
    <ConfigProvider
      theme={{
        algorithm: dark ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
        token: {
          colorPrimary: BRAND_COLOR,
          colorBgContainer: dark ? '#18181b' : '#ffffff',
          fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
        },
      }}
    >
      <AntApp>
        <Outlet />
      </AntApp>
    </ConfigProvider>
  );
}
