import komorebi from 'komorebi-theme';

const now = new Date();
const hour = now.getHours();
const weekdayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const timeGreeting =
  hour >= 5 && hour < 11
    ? '新しい一日が始まりました。'
    : hour >= 11 && hour < 14
      ? 'こんにちは！お昼のひととき、ここでほっと一息つきませんか？'
      : hour >= 14 && hour < 19
        ? 'こんにちは、午後の時間です。'
        : hour >= 19 && hour < 24
          ? 'こんばんは。'
          : '夜更けにようこそ。';
// 使用模板字符串显示日期
const todayWithWeekday = `今天是${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 ${weekdayNames[now.getDay()]}`;

const friends = [
  {
    name: 'huarun',
    url: 'https://blog.huarun.moe',
    avatar:
      'https://huarunblogimagehost.blob.core.windows.net/imagehost/huarun.png',
    description: '这是我自己！',
  },
  {
    name: 'utowo',
    url: 'https://utowo.github.io/',
    avatar: 'https://huarunblogimagehost.blob.core.windows.net/imagehost/avatars/utowo_avatar.jpg',
    description: '会 AI 跑图的大哥哥',
  },
  {
    name: 'kawasakikidou',
    url: 'https://blog.kawasakikidou.top/',
    avatar: 'https://kawasakikidou.z7.web.core.windows.net/avatar.avif',
    description: 're大手子',
  },
  {
    name: '今朝酒',
    url: 'https://www.kesazake.top/',
    avatar: 'https://huarunblogimagehost.blob.core.windows.net/imagehost/avatars/jinzhaojiu_avatar.jpg',
    description: '⑨歌',
  },
  {
    name: '時雨てる',
    url: 'https://keqing.moe/',
    avatar: 'https://avatars.githubusercontent.com/u/59642397?v=4',
    description: '',
  },
  {
    name: 'Phrinky',
    url: 'https://blog.rkk.moe/',
    avatar: 'https://avatars.githubusercontent.com/u/24487646?v=4',
    description: '可燃性物質です。',
  },
  {
    name: 'GamerNoTitle',
    url: 'https://bili33.top/',
    avatar: 'https://assets.bili33.top/img/AboutMe/logo-mini.png',
    description: 'TECH OTAKUS SAVE THE WORLD',
  },
];

export default komorebi({
  title: "huarun's Blog",
  tagline: "华闰的博客",
  locale: "zh-CN",
  pagination: { pageSize: 10 },
  home: {
    eyebrow: todayWithWeekday,
    title: timeGreeting,
    description: "欢迎来到我的博客。",
  },
  friends: friends,
  labels: {},
});
