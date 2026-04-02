import komorebi from 'komorebi-theme';

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
  tagline: "QwQ",
  locale: "zh-CN",
  pagination: { pageSize: 10 },
  home: {
    eyebrow: "欢迎来到这里",
    title: "Hi~",
    description: "欢迎来到我的博客。",
  },
  friends: friends,
  labels: {},
});
