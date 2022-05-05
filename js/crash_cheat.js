// 崩溃欺骗
var OriginTitle = document.title;
var titleTime;
document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    $('[rel="icon"]').attr('href', "/images/crash.png");
    document.title = '╭(°A°`)╮ 不要走啦 ~';
    clearTimeout(titleTime);
  } else {
    $('[rel="icon"]').attr('href', "/images/32x32.webp");
    document.title = '(ฅ>ω<*ฅ) 噫~ 来啦老弟 ~';
    titleTime = setTimeout(function () {
      document.title = OriginTitle;
    }, 2000);
  }
});
