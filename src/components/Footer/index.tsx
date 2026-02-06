import { useIntl } from 'umi';
import { GithubOutlined } from '@ant-design/icons';
import { DefaultFooter } from '@ant-design/pro-layout';

const Footer: React.FC = () => {
  const intl = useIntl();
  const defaultMessage = '寰擎印鹏海出品';

  return <DefaultFooter copyright={`2024 ${defaultMessage}`} />;
};

export default Footer;
