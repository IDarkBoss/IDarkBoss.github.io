/* global NexT, CONFIG */

HTMLElement.prototype.wrap = function(wrapper) {
  this.parentNode.insertBefore(wrapper, this);
  this.parentNode.removeChild(this);
  wrapper.appendChild(this);
};

NexT.utils = {

  /**
   * Wrap images with fancybox.
   */
  wrapImageWithFancyBox: function() {
    document.querySelectorAll('.post-body :not(a) > img, .post-body > img').forEach(element => {
      var $image = $(element);
      var imageLink = $image.attr('data-src') || $image.attr('src');
      var $imageWrapLink = $image.wrap(`<a class="fancybox fancybox.image" href="${imageLink}" itemscope itemtype="http://schema.org/ImageObject" itemprop="url"></a>`).parent('a');
      if ($image.is('.post-gallery img')) {
        $imageWrapLink.attr('data-fancybox', 'gallery').attr('rel', 'gallery');
      } else if ($image.is('.group-picture img')) {
        $imageWrapLink.attr('data-fancybox', 'group').attr('rel', 'group');
      } else {
        $imageWrapLink.attr('data-fancybox', 'default').attr('rel', 'default');
      }

      var imageTitle = $image.attr('title') || $image.attr('alt');
      if (imageTitle) {
        $imageWrapLink.append(`<p class="image-caption">${imageTitle}</p>`);
        // Make sure img title tag will show correctly in fancybox
        $imageWrapLink.attr('title', imageTitle).attr('data-caption', imageTitle);
      }
    });

    $.fancybox.defaults.hash = false;
    $('.fancybox').fancybox({
      loop   : true,
      helpers: {
        overlay: {
          locked: false
        }
      }
    });
  },

  registerExtURL: function() {
    document.querySelectorAll('span.exturl').forEach(element => {
      let link = document.createElement('a');
      // https://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings
      link.href = decodeURIComponent(atob(element.dataset.url).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      link.rel = 'noopener external nofollow noreferrer';
      link.target = '_blank';
      link.className = element.className;
      link.title = element.title;
      link.innerHTML = element.innerHTML;
      element.parentNode.replaceChild(link, element);
    });
  },

  /**
   * One-click copy code support.
   */
  registerCopyCode: function() {
    document.querySelectorAll('figure.highlight').forEach(element => {
      const box = document.createElement('div');
      element.wrap(box);
      box.classList.add('highlight-container');
      box.insertAdjacentHTML('beforeend', '<div class="copy-btn"><i class="fa fa-clipboard fa-fw"></i></div>');
      var button = element.parentNode.querySelector('.copy-btn');
      button.addEventListener('click', event => {
        var target = event.currentTarget;
        var code = [...target.parentNode.querySelectorAll('.code .line')].map(line => line.innerText).join('\n');
        var ta = document.createElement('textarea');
        ta.style.top = window.scrollY + 'px'; // Prevent page scrolling
        ta.style.position = 'absolute';
        ta.style.opacity = '0';
        ta.readOnly = true;
        ta.value = code;
        document.body.append(ta);
        const selection = document.getSelection();
        const selected = selection.rangeCount > 0 ? selection.getRangeAt(0) : false;
        ta.select();
        ta.setSelectionRange(0, code.length);
        ta.readOnly = false;
        var result = document.execCommand('copy');
        if (CONFIG.copycode.show_result) {
          target.querySelector('i').className = result ? 'fa fa-check fa-fw' : 'fa fa-times fa-fw';
        }
        ta.blur(); // For iOS
        target.blur();
        if (selected) {
          selection.removeAllRanges();
          selection.addRange(selected);
        }
        document.body.removeChild(ta);
      });
      button.addEventListener('mouseleave', event => {
        setTimeout(() => {
          event.target.querySelector('i').className = 'fa fa-clipboard fa-fw';
        }, 300);
      });
    });
  },

  wrapTableWithBox: function() {
    document.querySelectorAll('table').forEach(element => {
      const box = document.createElement('div');
      box.className = 'table-container';
      element.wrap(box);
    });
  },

  registerVideoIframe: function() {
    document.querySelectorAll('iframe').forEach(element => {
      const supported = [
        'www.youtube.com',
        'player.vimeo.com',
        'player.youku.com',
        'player.bilibili.com',
        'www.tudou.com'
      ].some(host => element.src.includes(host));
      if (supported && !element.parentNode.matches('.video-container')) {
        const box = document.createElement('div');
        box.className = 'video-container';
        element.wrap(box);
        let width = Number(element.width);
        let height = Number(element.height);
        if (width && height) {
          element.parentNode.style.paddingTop = (height / width * 100) + '%';
        }
      }
    });
  },

  registerScrollPercent: function() {
    var THRESHOLD = 50;
    var backToTop = document.querySelector('.back-to-top');
    var readingProgressBar = document.querySelector('.reading-progress-bar');
    // For init back to top in sidebar if page was scrolled after page refresh.
    window.addEventListener('scroll', () => {
      if (backToTop || readingProgressBar) {
        var docHeight = document.querySelector('.container').offsetHeight;
        var winHeight = window.innerHeight;
        var contentVisibilityHeight = docHeight > winHeight ? docHeight - winHeight : document.body.scrollHeight - winHeight;
        var scrollPercent = Math.min(100 * window.scrollY / contentVisibilityHeight, 100);
        if (backToTop) {
          backToTop.classList.toggle('back-to-top-on', window.scrollY > THRESHOLD);
          backToTop.querySelector('span').innerText = Math.round(scrollPercent) + '%';
        }
        if (readingProgressBar) {
          readingProgressBar.style.width = scrollPercent.toFixed(2) + '%';
        }
      }
    });

    backToTop && backToTop.addEventListener('click', () => {
      window.anime({
        targets  : document.scrollingElement,
        duration : 500,
        easing   : 'linear',
        scrollTop: 0
      });
    });
  },

  /**
   * Tabs tag listener (without twitter bootstrap).
   */
  registerTabsTag: function() {
    // Binding `nav-tabs` & `tab-content` by real time permalink changing.
    document.querySelectorAll('.tabs ul.nav-tabs .tab').forEach(element => {
      element.addEventListener('click', event => {
        event.preventDefault();
        var target = event.currentTarget;
        // Prevent selected tab to select again.
        if (!target.classList.contains('active')) {
          // Add & Remove active class on `nav-tabs` & `tab-content`.
          [...target.parentNode.children].forEach(element => {
            element.classList.remove('active');
          });
          target.classList.add('active');
          var tActive = document.getElementById(target.querySelector('a').getAttribute('href').replace('#', ''));
          [...tActive.parentNode.children].forEach(element => {
            element.classList.remove('active');
          });
          tActive.classList.add('active');
          // Trigger event
          tActive.dispatchEvent(new Event('tabs:click', {
            bubbles: true
          }));
        }
      });
    });

    window.dispatchEvent(new Event('tabs:register'));
  },

  registerCanIUseTag: function() {
    // Get responsive height passed from iframe.
    window.addEventListener('message', ({ data }) => {
      if ((typeof data === 'string') && data.includes('ciu_embed')) {
        var featureID = data.split(':')[1];
        var height = data.split(':')[2];
        document.querySelector(`iframe[data-feature=${featureID}]`).style.height = parseInt(height, 10) + 5 + 'px';
      }
    }, false);
  },

  registerActiveMenuItem: function() {
    document.querySelectorAll('.menu-item').forEach(element => {
      var target = element.querySelector('a[href]');
      if (!target) return;
      var isSamePath = target.pathname === location.pathname || target.pathname === location.pathname.replace('index.html', '');
      var isSubPath = !CONFIG.root.startsWith(target.pathname) && location.pathname.startsWith(target.pathname);
      element.classList.toggle('menu-item-active', target.hostname === location.hostname && (isSamePath || isSubPath));
    });
  },

  registerLangSelect: function() {
    let sel = document.querySelector('.lang-select');
    if (!sel) return;
    sel.value = CONFIG.page.lang;
    sel.addEventListener('change', () => {
      let target = sel.options[sel.selectedIndex];
      document.querySelector('.lang-select-label span').innerText = target.text;
      let url = target.dataset.href;
      window.pjax ? window.pjax.loadUrl(url) : window.location.href = url;
    });
  },

  registerSidebarTOC: function() {
    const navItems = document.querySelectorAll('.post-toc li');
    const sections = [...navItems].map(element => {
      var link = element.querySelector('a.nav-link');
      // TOC item animation navigate.
      link.addEventListener('click', event => {
        event.preventDefault();
        var target = document.getElementById(event.currentTarget.getAttribute('href').replace('#', ''));
        var offset = target.getBoundingClientRect().top + window.scrollY;
        window.anime({
          targets  : document.scrollingElement,
          duration : 500,
          easing   : 'linear',
          scrollTop: offset + 10
        });
      });
      return document.getElementById(link.getAttribute('href').replace('#', ''));
    });

    var tocElement = document.querySelector('.post-toc-wrap');
    function activateNavByIndex(target) {
      if (target.classList.contains('active-current')) return;

      document.querySelectorAll('.post-toc .active').forEach(element => {
        element.classList.remove('active', 'active-current');
      });
      target.classList.add('active', 'active-current');
      var parent = target.parentNode;
      while (!parent.matches('.post-toc')) {
        if (parent.matches('li')) parent.classList.add('active');
        parent = parent.parentNode;
      }
      // Scrolling to center active TOC element if TOC content is taller then viewport.
      window.anime({
        targets  : tocElement,
        duration : 200,
        easing   : 'linear',
        scrollTop: tocElement.scrollTop - (tocElement.offsetHeight / 2) + target.getBoundingClientRect().top - tocElement.getBoundingClientRect().top
      });
    }

    function findIndex(entries) {
      let index = 0;
      let entry = entries[index];
      if (entry.boundingClientRect.top > 0) {
        index = sections.indexOf(entry.target);
        return index === 0 ? 0 : index - 1;
      }
      for (; index < entries.length; index++) {
        if (entries[index].boundingClientRect.top <= 0) {
          entry = entries[index];
        } else {
          return sections.indexOf(entry.target);
        }
      }
      return sections.indexOf(entry.target);
    }

    function createIntersectionObserver(marginTop) {
      marginTop = Math.floor(marginTop + 10000);
      let intersectionObserver = new IntersectionObserver((entries, observe) => {
        let scrollHeight = document.documentElement.scrollHeight + 100;
        if (scrollHeight > marginTop) {
          observe.disconnect();
          createIntersectionObserver(scrollHeight);
          return;
        }
        let index = findIndex(entries);
        activateNavByIndex(navItems[index]);
      }, {
        rootMargin: marginTop + 'px 0px -100% 0px',
        threshold : 0
      });
      sections.forEach(element => {
        element && intersectionObserver.observe(element);
      });
    }
    createIntersectionObserver(document.documentElement.scrollHeight);
  },

  hasMobileUA: function() {
    let ua = navigator.userAgent;
    let pa = /iPad|iPhone|Android|Opera Mini|BlackBerry|webOS|UCWEB|Blazer|PSP|IEMobile|Symbian/g;
    return pa.test(ua);
  },

  isTablet: function() {
    return window.screen.width < 992 && window.screen.width > 767 && this.hasMobileUA();
  },

  isMobile: function() {
    return window.screen.width < 767 && this.hasMobileUA();
  },

  isDesktop: function() {
    return !this.isTablet() && !this.isMobile();
  },

  supportsPDFs: function() {
    let ua = navigator.userAgent;
    let isFirefoxWithPDFJS = ua.includes('irefox') && parseInt(ua.split('rv:')[1].split('.')[0], 10) > 18;
    let supportsPdfMimeType = typeof navigator.mimeTypes['application/pdf'] !== 'undefined';
    let isIOS = /iphone|ipad|ipod/i.test(ua.toLowerCase());
    return isFirefoxWithPDFJS || (supportsPdfMimeType && !isIOS);
  },

  /**
   * Init Sidebar & TOC inner dimensions on all pages and for all schemes.
   * Need for Sidebar/TOC inner scrolling if content taller then viewport.
   */
  initSidebarDimension: function() {
    var sidebarNav = document.querySelector('.sidebar-nav');
    var sidebarNavHeight = sidebarNav.style.display !== 'none' ? sidebarNav.offsetHeight : 0;
    var sidebarOffset = CONFIG.sidebar.offset || 12;
    var sidebarb2tHeight = CONFIG.back2top.enable && CONFIG.back2top.sidebar ? document.querySelector('.back-to-top').offsetHeight : 0;
    var sidebarSchemePadding = (CONFIG.sidebar.padding * 2) + sidebarNavHeight + sidebarb2tHeight;
    // Margin of sidebar b2t: -4px -10px -18px, brings a different of 22px.
    if (CONFIG.scheme === 'Pisces' || CONFIG.scheme === 'Gemini') sidebarSchemePadding += (sidebarOffset * 2) - 22;
    // Initialize Sidebar & TOC Height.
    var sidebarWrapperHeight = document.body.offsetHeight - sidebarSchemePadding + 'px';
    document.querySelector('.site-overview-wrap').style.maxHeight = sidebarWrapperHeight;
    document.querySelector('.post-toc-wrap').style.maxHeight = sidebarWrapperHeight;
  },

  updateSidebarPosition: function() {
    var sidebarNav = document.querySelector('.sidebar-nav');
    var hasTOC = document.querySelector('.post-toc');
    if (hasTOC) {
      sidebarNav.style.display = '';
      sidebarNav.classList.add('motion-element');
      document.querySelector('.sidebar-nav-toc').click();
    } else {
      sidebarNav.style.display = 'none';
      sidebarNav.classList.remove('motion-element');
      document.querySelector('.sidebar-nav-overview').click();
    }
    NexT.utils.initSidebarDimension();
    if (!this.isDesktop() || CONFIG.scheme === 'Pisces' || CONFIG.scheme === 'Gemini') return;
    // Expand sidebar on post detail page by default, when post has a toc.
    var display = CONFIG.page.sidebar;
    if (typeof display !== 'boolean') {
      // There's no definition sidebar in the page front-matter.
      display = CONFIG.sidebar.display === 'always' || (CONFIG.sidebar.display === 'post' && hasTOC);
    }
    if (display) {
      window.dispatchEvent(new Event('sidebar:show'));
    }
  },

  getScript: function(url, callback, condition) {
    if (condition) {
      callback();
    } else {
      var script = document.createElement('script');
      script.onload = script.onreadystatechange = function(_, isAbort) {
        if (isAbort || !script.readyState || /loaded|complete/.test(script.readyState)) {
          script.onload = script.onreadystatechange = null;
          script = undefined;
          if (!isAbort && callback) setTimeout(callback, 0);
        }
      };
      script.src = url;
      document.head.appendChild(script);
    }
  },

  loadComments: function(element, callback) {
    if (!CONFIG.comments.lazyload || !element) {
      callback();
      return;
    }
    let intersectionObserver = new IntersectionObserver((entries, observer) => {
      let entry = entries[0];
      if (entry.isIntersecting) {
        callback();
        observer.disconnect();
      }
    });
    intersectionObserver.observe(element);
    return intersectionObserver;
  }
};
;
/* global NexT, CONFIG, Velocity */

if (window.$ && window.$.Velocity) window.Velocity = window.$.Velocity;

NexT.motion = {};

NexT.motion.integrator = {
  queue : [],
  cursor: -1,
  init  : function() {
    this.queue = [];
    this.cursor = -1;
    return this;
  },
  add: function(fn) {
    this.queue.push(fn);
    return this;
  },
  next: function() {
    this.cursor++;
    var fn = this.queue[this.cursor];
    typeof fn === 'function' && fn(NexT.motion.integrator);
  },
  bootstrap: function() {
    this.next();
  }
};

NexT.motion.middleWares = {
  logo: function(integrator) {
    var sequence = [];
    var brand = document.querySelector('.brand');
    var image = document.querySelector('.custom-logo-image');
    var title = document.querySelector('.site-title');
    var subtitle = document.querySelector('.site-subtitle');
    var logoLineTop = document.querySelector('.logo-line-before i');
    var logoLineBottom = document.querySelector('.logo-line-after i');

    brand && sequence.push({
      e: brand,
      p: {opacity: 1},
      o: {duration: 200}
    });

    function getMistLineSettings(element, translateX) {
      return {
        e: element,
        p: {translateX},
        o: {
          duration     : 500,
          sequenceQueue: false
        }
      };
    }

    function pushImageToSequence() {
      sequence.push({
        e: image,
        p: {opacity: 1, top: 0},
        o: {duration: 200}
      });
    }

    CONFIG.scheme === 'Mist' && logoLineTop && logoLineBottom
    && sequence.push(
      getMistLineSettings(logoLineTop, '100%'),
      getMistLineSettings(logoLineBottom, '-100%')
    );

    CONFIG.scheme === 'Muse' && image && pushImageToSequence();

    title && sequence.push({
      e: title,
      p: {opacity: 1, top: 0},
      o: {duration: 200}
    });

    subtitle && sequence.push({
      e: subtitle,
      p: {opacity: 1, top: 0},
      o: {duration: 200}
    });

    (CONFIG.scheme === 'Pisces' || CONFIG.scheme === 'Gemini') && image && pushImageToSequence();

    if (sequence.length > 0) {
      sequence[sequence.length - 1].o.complete = function() {
        integrator.next();
      };
      Velocity.RunSequence(sequence);
    } else {
      integrator.next();
    }

    if (CONFIG.motion.async) {
      integrator.next();
    }
  },

  menu: function(integrator) {
    Velocity(document.querySelectorAll('.menu-item'), 'transition.slideDownIn', {
      display : null,
      duration: 200,
      complete: function() {
        integrator.next();
      }
    });

    if (CONFIG.motion.async) {
      integrator.next();
    }
  },

  subMenu: function(integrator) {
    var subMenuItem = document.querySelectorAll('.sub-menu .menu-item');
    if (subMenuItem.length > 0) {
      subMenuItem.forEach(element => {
        element.style.opacity = 1;
      });
    }
    integrator.next();
  },

  postList: function(integrator) {
    var postBlock = document.querySelectorAll('.post-block, .pagination, .comments');
    var postBlockTransition = CONFIG.motion.transition.post_block;
    var postHeader = document.querySelectorAll('.post-header');
    var postHeaderTransition = CONFIG.motion.transition.post_header;
    var postBody = document.querySelectorAll('.post-body');
    var postBodyTransition = CONFIG.motion.transition.post_body;
    var collHeader = document.querySelectorAll('.collection-header');
    var collHeaderTransition = CONFIG.motion.transition.coll_header;

    if (postBlock.length > 0) {
      var postMotionOptions = window.postMotionOptions || {
        stagger : 100,
        drag    : true,
        complete: function() {
          integrator.next();
        }
      };

      if (CONFIG.motion.transition.post_block) {
        Velocity(postBlock, 'transition.' + postBlockTransition, postMotionOptions);
      }
      if (CONFIG.motion.transition.post_header) {
        Velocity(postHeader, 'transition.' + postHeaderTransition, postMotionOptions);
      }
      if (CONFIG.motion.transition.post_body) {
        Velocity(postBody, 'transition.' + postBodyTransition, postMotionOptions);
      }
      if (CONFIG.motion.transition.coll_header) {
        Velocity(collHeader, 'transition.' + collHeaderTransition, postMotionOptions);
      }
    }
    if (CONFIG.scheme === 'Pisces' || CONFIG.scheme === 'Gemini') {
      integrator.next();
    }
  },

  sidebar: function(integrator) {
    var sidebarAffix = document.querySelector('.sidebar-inner');
    var sidebarAffixTransition = CONFIG.motion.transition.sidebar;
    // Only for Pisces | Gemini.
    if (sidebarAffixTransition && (CONFIG.scheme === 'Pisces' || CONFIG.scheme === 'Gemini')) {
      Velocity(sidebarAffix, 'transition.' + sidebarAffixTransition, {
        display : null,
        duration: 200,
        complete: function() {
          // After motion complete need to remove transform from sidebar to let affix work on Pisces | Gemini.
          sidebarAffix.style.transform = 'initial';
        }
      });
    }
    integrator.next();
  }
};
;
/* global NexT, CONFIG */

var Affix = {
  init: function(element, options) {
    this.element = element;
    this.offset = options || 0;
    this.affixed = null;
    this.unpin = null;
    this.pinnedOffset = null;
    this.checkPosition();
    window.addEventListener('scroll', this.checkPosition.bind(this));
    window.addEventListener('click', this.checkPositionWithEventLoop.bind(this));
    window.matchMedia('(min-width: 992px)').addListener(event => {
      if (event.matches) {
        this.offset = NexT.utils.getAffixParam();
        this.checkPosition();
      }
    });
  },
  getState: function(scrollHeight, height, offsetTop, offsetBottom) {
    let scrollTop = window.scrollY;
    let targetHeight = window.innerHeight;
    if (offsetTop != null && this.affixed === 'top') {
      if (document.querySelector('.content-wrap').offsetHeight < offsetTop) return 'top';
      return scrollTop < offsetTop ? 'top' : false;
    }
    if (this.affixed === 'bottom') {
      if (offsetTop != null) return this.unpin <= this.element.getBoundingClientRect().top ? false : 'bottom';
      return scrollTop + targetHeight <= scrollHeight - offsetBottom ? false : 'bottom';
    }
    let initializing = this.affixed === null;
    let colliderTop = initializing ? scrollTop : this.element.getBoundingClientRect().top + scrollTop;
    let colliderHeight = initializing ? targetHeight : height;
    if (offsetTop != null && scrollTop <= offsetTop) return 'top';
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom';
    return false;
  },
  getPinnedOffset: function() {
    if (this.pinnedOffset) return this.pinnedOffset;
    this.element.classList.remove('affix-top', 'affix-bottom');
    this.element.classList.add('affix');
    return (this.pinnedOffset = this.element.getBoundingClientRect().top);
  },
  checkPositionWithEventLoop() {
    setTimeout(this.checkPosition.bind(this), 1);
  },
  checkPosition: function() {
    if (window.getComputedStyle(this.element).display === 'none') return;
    let height = this.element.offsetHeight;
    let { offset } = this;
    let offsetTop = offset.top;
    let offsetBottom = offset.bottom;
    let { scrollHeight } = document.body;
    let affix = this.getState(scrollHeight, height, offsetTop, offsetBottom);
    if (this.affixed !== affix) {
      if (this.unpin != null) this.element.style.top = '';
      let affixType = 'affix' + (affix ? '-' + affix : '');
      this.affixed = affix;
      this.unpin = affix === 'bottom' ? this.getPinnedOffset() : null;
      this.element.classList.remove('affix', 'affix-top', 'affix-bottom');
      this.element.classList.add(affixType);
    }
    if (affix === 'bottom') {
      this.element.style.top = scrollHeight - height - offsetBottom + 'px';
    }
  }
};

NexT.utils.getAffixParam = function() {
  const sidebarOffset = CONFIG.sidebar.offset || 12;

  let headerOffset = document.querySelector('.header-inner').offsetHeight;
  let footerOffset = document.querySelector('.footer').offsetHeight;

  document.querySelector('.sidebar').style.marginTop = headerOffset + sidebarOffset + 'px';

  return {
    top   : headerOffset,
    bottom: footerOffset
  };
};

window.addEventListener('DOMContentLoaded', () => {

  Affix.init(document.querySelector('.sidebar-inner'), NexT.utils.getAffixParam());
});
;
/* global NexT, CONFIG, Velocity */

NexT.boot = {};

NexT.boot.registerEvents = function() {

  NexT.utils.registerScrollPercent();
  NexT.utils.registerCanIUseTag();

  // Mobile top menu bar.
  document.querySelector('.site-nav-toggle .toggle').addEventListener('click', () => {
    event.currentTarget.classList.toggle('toggle-close');
    var siteNav = document.querySelector('.site-nav');
    var animateAction = siteNav.classList.contains('site-nav-on') ? 'slideUp' : 'slideDown';

    if (typeof Velocity === 'function') {
      Velocity(siteNav, animateAction, {
        duration: 200,
        complete: function() {
          siteNav.classList.toggle('site-nav-on');
        }
      });
    } else {
      siteNav.classList.toggle('site-nav-on');
    }
  });

  var TAB_ANIMATE_DURATION = 200;
  document.querySelectorAll('.sidebar-nav li').forEach((element, index) => {
    element.addEventListener('click', event => {
      var item = event.currentTarget;
      var activeTabClassName = 'sidebar-nav-active';
      var activePanelClassName = 'sidebar-panel-active';
      if (item.classList.contains(activeTabClassName)) return;

      var targets = document.querySelectorAll('.sidebar-panel');
      var target = targets[index];
      var currentTarget = targets[1 - index];
      window.anime({
        targets : currentTarget,
        duration: TAB_ANIMATE_DURATION,
        easing  : 'linear',
        opacity : 0,
        complete: () => {
          // Prevent adding TOC to Overview if Overview was selected when close & open sidebar.
          currentTarget.classList.remove(activePanelClassName);
          target.style.opacity = 0;
          target.classList.add(activePanelClassName);
          window.anime({
            targets : target,
            duration: TAB_ANIMATE_DURATION,
            easing  : 'linear',
            opacity : 1
          });
        }
      });

      [...item.parentNode.children].forEach(element => {
        element.classList.remove(activeTabClassName);
      });
      item.classList.add(activeTabClassName);
    });
  });

  window.addEventListener('resize', NexT.utils.initSidebarDimension);

  window.addEventListener('hashchange', () => {
    var tHash = location.hash;
    if (tHash !== '' && !tHash.match(/%\S{2}/)) {
      var target = document.querySelector(`.tabs ul.nav-tabs li a[href="${tHash}"]`);
      target && target.click();
    }
  });
};

NexT.boot.refresh = function() {

  /**
   * Register JS handlers by condition option.
   * Need to add config option in Front-End at 'layout/_partials/head.swig' file.
   */
  CONFIG.fancybox && NexT.utils.wrapImageWithFancyBox();
  CONFIG.mediumzoom && window.mediumZoom('.post-body :not(a) > img, .post-body > img');
  CONFIG.lazyload && window.lozad('.post-body img').observe();
  CONFIG.pangu && window.pangu.spacingPage();

  CONFIG.exturl && NexT.utils.registerExtURL();
  CONFIG.copycode.enable && NexT.utils.registerCopyCode();
  NexT.utils.registerTabsTag();
  NexT.utils.registerActiveMenuItem();
  NexT.utils.registerLangSelect();
  NexT.utils.registerSidebarTOC();
  NexT.utils.wrapTableWithBox();
  NexT.utils.registerVideoIframe();
};

NexT.boot.motion = function() {
  // Define Motion Sequence & Bootstrap Motion.
  if (CONFIG.motion.enable) {
    NexT.motion.integrator
      .add(NexT.motion.middleWares.logo)
      .add(NexT.motion.middleWares.menu)
      .add(NexT.motion.middleWares.postList)
      .add(NexT.motion.middleWares.sidebar)
      .bootstrap();
  }
  NexT.utils.updateSidebarPosition();
};

window.addEventListener('DOMContentLoaded', () => {
  NexT.boot.registerEvents();
  NexT.boot.refresh();
  NexT.boot.motion();
});
;
/* global CONFIG */

window.addEventListener('DOMContentLoaded', () => {
  // Popup Window
  let isfetched = false;
  let datas;
  let isXml = true;
  // Search DB path
  let searchPath = CONFIG.path;
  if (searchPath.length === 0) {
    searchPath = 'search.xml';
  } else if (searchPath.endsWith('json')) {
    isXml = false;
  }
  const input = document.querySelector('.search-input');
  const resultContent = document.getElementById('search-result');

  const getIndexByWord = (word, text, caseSensitive) => {
    if (CONFIG.localsearch.unescape) {
      let div = document.createElement('div');
      div.innerText = word;
      word = div.innerHTML;
    }
    let wordLen = word.length;
    if (wordLen === 0) return [];
    let startPosition = 0;
    let position = [];
    let index = [];
    if (!caseSensitive) {
      text = text.toLowerCase();
      word = word.toLowerCase();
    }
    while ((position = text.indexOf(word, startPosition)) > -1) {
      index.push({
        position,
        word
      });
      startPosition = position + wordLen;
    }
    return index;
  };

  // Merge hits into slices
  const mergeIntoSlice = (start, end, index, searchText) => {
    let item = index[index.length - 1];
    let {
      position,
      word
    } = item;
    let hits = [];
    let searchTextCountInSlice = 0;
    while (position + word.length <= end && index.length !== 0) {
      if (word === searchText) {
        searchTextCountInSlice++;
      }
      hits.push({
        position,
        length: word.length
      });
      let wordEnd = position + word.length;

      // Move to next position of hit
      index.pop();
      while (index.length !== 0) {
        item = index[index.length - 1];
        position = item.position;
        word = item.word;
        if (wordEnd > position) {
          index.pop();
        } else {
          break;
        }
      }
    }
    return {
      hits,
      start,
      end,
      searchTextCount: searchTextCountInSlice
    };
  };

  // Highlight title and content
  const highlightKeyword = (text, slice) => {
    let result = '';
    let prevEnd = slice.start;
    slice.hits.forEach(hit => {
      result += text.substring(prevEnd, hit.position);
      let end = hit.position + hit.length;
      result += `<b class="search-keyword">${text.substring(hit.position, end)}</b>`;
      prevEnd = end;
    });
    result += text.substring(prevEnd, slice.end);
    return result;
  };

  const inputEventFunction = () => {
    if (!isfetched) return;
    let searchText = input.value.trim().toLowerCase();
    let keywords = searchText.split(/[-\s]+/);
    if (keywords.length > 1) {
      keywords.push(searchText);
    }
    let resultItems = [];
    if (searchText.length > 0) {
      // Perform local searching
      datas.forEach(({
        title,
        content,
        url
      }) => {
        let titleInLowerCase = title.toLowerCase();
        let contentInLowerCase = content.toLowerCase();
        let indexOfTitle = [];
        let indexOfContent = [];
        let searchTextCount = 0;
        keywords.forEach(keyword => {
          indexOfTitle = indexOfTitle.concat(getIndexByWord(keyword, titleInLowerCase, false));
          indexOfContent = indexOfContent.concat(getIndexByWord(keyword, contentInLowerCase, false));
        });

        // Show search results
        if (indexOfTitle.length > 0 || indexOfContent.length > 0) {
          let hitCount = indexOfTitle.length + indexOfContent.length;
          // Sort index by position of keyword
          [indexOfTitle, indexOfContent].forEach(index => {
            index.sort((itemLeft, itemRight) => {
              if (itemRight.position !== itemLeft.position) {
                return itemRight.position - itemLeft.position;
              }
              return itemLeft.word.length - itemRight.word.length;
            });
          });

          let slicesOfTitle = [];
          if (indexOfTitle.length !== 0) {
            let tmp = mergeIntoSlice(0, title.length, indexOfTitle, searchText);
            searchTextCount += tmp.searchTextCountInSlice;
            slicesOfTitle.push(tmp);
          }

          let slicesOfContent = [];
          while (indexOfContent.length !== 0) {
            let item = indexOfContent[indexOfContent.length - 1];
            let {
              position,
              word
            } = item;
            // Cut out 100 characters
            let start = position - 20;
            let end = position + 80;
            if (start < 0) {
              start = 0;
            }
            if (end < position + word.length) {
              end = position + word.length;
            }
            if (end > content.length) {
              end = content.length;
            }
            let tmp = mergeIntoSlice(start, end, indexOfContent, searchText);
            searchTextCount += tmp.searchTextCountInSlice;
            slicesOfContent.push(tmp);
          }

          // Sort slices in content by search text's count and hits' count
          slicesOfContent.sort((sliceLeft, sliceRight) => {
            if (sliceLeft.searchTextCount !== sliceRight.searchTextCount) {
              return sliceRight.searchTextCount - sliceLeft.searchTextCount;
            } else if (sliceLeft.hits.length !== sliceRight.hits.length) {
              return sliceRight.hits.length - sliceLeft.hits.length;
            }
            return sliceLeft.start - sliceRight.start;
          });

          // Select top N slices in content
          let upperBound = parseInt(CONFIG.localsearch.top_n_per_article, 10);
          if (upperBound >= 0) {
            slicesOfContent = slicesOfContent.slice(0, upperBound);
          }

          let resultItem = '';

          if (slicesOfTitle.length !== 0) {
            resultItem += `<li><a href="${url}" class="search-result-title">${highlightKeyword(title, slicesOfTitle[0])}</a>`;
          } else {
            resultItem += `<li><a href="${url}" class="search-result-title">${title}</a>`;
          }

          slicesOfContent.forEach(slice => {
            resultItem += `<a href="${url}"><p class="search-result">${highlightKeyword(content, slice)}...</p></a>`;
          });

          resultItem += '</li>';
          resultItems.push({
            item: resultItem,
            id: resultItems.length,
            hitCount,
            searchTextCount
          });
        }
      });
    }
    if (keywords.length === 1 && keywords[0] === '') {
      resultContent.innerHTML = '<div id="no-result"><i class="fa fa-search fa-5x"></i></div>';
    } else if (resultItems.length === 0) {
      resultContent.innerHTML = '<div id="no-result"><i class="far fa-frown fa-5x"></i></div>';
    } else {
      resultItems.sort((resultLeft, resultRight) => {
        if (resultLeft.searchTextCount !== resultRight.searchTextCount) {
          return resultRight.searchTextCount - resultLeft.searchTextCount;
        } else if (resultLeft.hitCount !== resultRight.hitCount) {
          return resultRight.hitCount - resultLeft.hitCount;
        }
        return resultRight.id - resultLeft.id;
      });
      resultContent.innerHTML = `<ul class="search-result-list">${resultItems.map(result => result.item).join('')}</ul>`;
      window.pjax && window.pjax.refresh(resultContent);
    }
  };

  const fetchData = () => {
    fetch(CONFIG.root + searchPath)
      .then(response => response.text())
      .then(res => {
        // Get the contents from search data
        isfetched = true;
        datas = isXml ? [...new DOMParser().parseFromString(res, 'text/xml').querySelectorAll('entry')].map(element => {
          return {
            title: element.querySelector('title').textContent,
            content: element.querySelector('content').textContent,
            url: element.querySelector('url').textContent
          };
        }) : JSON.parse(res);
        // Only match articles with not empty titles
        datas = datas.filter(data => data.title).map(data => {
          data.title = data.title.trim();
          data.content = data.content ? data.content.trim().replace(/<[^>]+>/g, '') : '';
          data.url = decodeURIComponent(data.url).replace(/\/{2,}/g, '/');
          return data;
        });
        // Remove loading animation
        document.getElementById('no-result').innerHTML = '<i class="fa fa-search fa-5x"></i>';
        inputEventFunction();
      });
  };

  if (CONFIG.localsearch.preload) {
    fetchData();
  }

  if (CONFIG.localsearch.trigger === 'auto') {
    input.addEventListener('input', inputEventFunction);
  } else {
    document.querySelector('.search-icon').addEventListener('click', inputEventFunction);
    input.addEventListener('keypress', event => {
      if (event.key === 'Enter') {
        inputEventFunction();
      }
    });
  }

  // Handle and trigger popup window
  document.querySelectorAll('.popup-trigger').forEach(element => {
    element.addEventListener('click', () => {
      document.body.style.overflow = 'hidden';
      document.querySelector('.search-pop-overlay').classList.add('search-active');
      input.focus();
      if (!isfetched) fetchData();
    });
  });

  // Monitor main search box
  const onPopupClose = () => {
    document.body.style.overflow = '';
    document.querySelector('.search-pop-overlay').classList.remove('search-active');
  };

  document.querySelector('.search-pop-overlay').addEventListener('click', event => {
    if (event.target === document.querySelector('.search-pop-overlay')) {
      onPopupClose();
    }
  });
  document.querySelector('.popup-btn-close').addEventListener('click', onPopupClose);
  window.addEventListener('pjax:success', onPopupClose);
  window.addEventListener('keyup', event => {
    if (event.key === 'Escape') {
      onPopupClose();
    }
  });
});
;
"use strict";((e,t)=>{const o=function(){const o=t.documentElement.offsetHeight,n=t.documentElement.scrollHeight,l=t.documentElement.scrollTop||e.pageYOffset||t.body.scrollTop;let s=Math.round(l/(n-o)*100);s>100&&(s=100);const c=t.querySelector(".moon-menu-icon"),r=t.querySelector(".moon-menu-text");s?(c.style.display="none",r.style.display="block",r.innerHTML=s+"%"):(s=0,c.style.display="block",r.style.display="none");t.querySelector(".moon-menu-border").style.strokeDasharray=196*s/100+" 196"};e.addEventListener("load",()=>{o()}),e.addEventListener("scroll",o),t.querySelector(".moon-menu-button").addEventListener("click",()=>{t.querySelector(".moon-menu-icon").classList.toggle("active");const e=t.querySelector(".moon-menu-items");e.classList.toggle("active");const o=t.querySelectorAll(".moon-menu-item");if(e.classList.contains("active"))for(let e=0;e<o.length;e++)o[e].style.top=-3-3*e+"em",o[e].style.opacity=.9;else for(let e=0;e<o.length;e++)o[e].style.top="1em",o[e].style.opacity=0})})(window,document);var back2top=()=>{window.scroll({top:0,behavior:"smooth"})},back2bottom=()=>{const e=document.documentElement.offsetHeight,t=document.documentElement.scrollHeight;window.scroll({top:t-e,behavior:"smooth"})};;
"use strict";

function updateCoords(e) {
  pointerX = (e.clientX || e.touches[0].clientX) - canvasEl.getBoundingClientRect().left, pointerY = e.clientY || e.touches[0].clientY - canvasEl.getBoundingClientRect().top
}

function setParticuleDirection(e) {
  var t = anime.random(0, 360) * Math.PI / 180,
    a = anime.random(50, 180),
    n = [-1, 1][anime.random(0, 1)] * a;
  return {
    x: e.x + n * Math.cos(t),
    y: e.y + n * Math.sin(t)
  }
}

function createParticule(e, t) {
  var a = {};
  return a.x = e, a.y = t, a.color = colors[anime.random(0, colors.length - 1)], a.radius = anime.random(16, 32), a.endPos = setParticuleDirection(a), a.draw = function () {
    ctx.beginPath(), ctx.arc(a.x, a.y, a.radius, 0, 2 * Math.PI, !0), ctx.fillStyle = a.color, ctx.fill()
  }, a
}

function createCircle(e, t) {
  var a = {};
  return a.x = e, a.y = t, a.color = "#F00", a.radius = .1, a.alpha = .5, a.lineWidth = 6, a.draw = function () {
    ctx.globalAlpha = a.alpha, ctx.beginPath(), ctx.arc(a.x, a.y, a.radius, 0, 2 * Math.PI, !0), ctx.lineWidth = a.lineWidth, ctx.strokeStyle = a.color, ctx.stroke(), ctx.globalAlpha = 1
  }, a
}

function renderParticule(e) {
  for (var t = 0; t < e.animatables.length; t++) e.animatables[t].target.draw()
}

function animateParticules(e, t) {
  for (var a = createCircle(e, t), n = [], i = 0; i < numberOfParticules; i++) n.push(createParticule(e, t));
  anime.timeline().add({
    targets: n,
    x: function (e) {
      return e.endPos.x
    },
    y: function (e) {
      return e.endPos.y
    },
    radius: .1,
    duration: anime.random(1200, 1800),
    easing: "easeOutExpo",
    update: renderParticule
  }).add({
    targets: a,
    radius: anime.random(80, 160),
    lineWidth: 0,
    alpha: {
      value: 0,
      easing: "linear",
      duration: anime.random(600, 800)
    },
    duration: anime.random(1200, 1800),
    easing: "easeOutExpo",
    update: renderParticule,
    offset: 0
  })
}

function debounce(e, t) {
  var a;
  return function () {
    var n = this,
      i = arguments;
    clearTimeout(a), a = setTimeout(function () {
      e.apply(n, i)
    }, t)
  }
}
var canvasEl = document.querySelector(".fireworks");
if (canvasEl) {
  var ctx = canvasEl.getContext("2d"),
    numberOfParticules = 30,
    pointerX = 0,
    pointerY = 0,
    tap = "mousedown",
    colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"],
    setCanvasSize = debounce(function () {
      canvasEl.width = 2 * window.innerWidth, canvasEl.height = 2 * window.innerHeight, canvasEl.style.width = window.innerWidth + "px", canvasEl.style.height = window.innerHeight + "px", canvasEl.getContext("2d").scale(2, 2)
    }, 500),
    render = anime({
      duration: 1 / 0,
      update: function () {
        ctx.clearRect(0, 0, canvasEl.width, canvasEl.height)
      }
    });
  document.addEventListener(tap, function (e) {
    "sidebar" !== e.target.id && "toggle-sidebar" !== e.target.id && "A" !== e.target.nodeName && "IMG" !== e.target.nodeName && (render.play(), updateCoords(e), animateParticules(pointerX, pointerY))
  }, !1), setCanvasSize(), window.addEventListener("resize", setCanvasSize, !1)
}
;
// build time:Thu Apr 30 2020 11:10:13 GMT+0800 (GMT+08:00)
(function(){var A=["/*","/*","/* i really want this to be global */","/* ","/* Cursor - Skyrim - KMV","/* https://userstyles.org/styles/175086/","/*","/* Designed for Stylus:","/* https://add0n.com/stylus.html","/* ","/* Other Themes by KMV:","/* https://userstyles.org/users/370722","/*","/* Contact:","/* https://www.reddit.com/r/KMV/","/*","*/","*","{",'    cursor: url("data:image/x-icon;base64,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"), default;',"}","","/*Forceful Additions - Main Cursor*/","div,","input,","ul","{",'    cursor: url("data:image/x-icon;base64,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"), default !important;',"}","","a,","a *,","a:hover,","a:focus,","span[onclick]:hover,",'[class*="close"]:hover,','[class*="Close"]:hover,','[class*="volume"],','[id*="close"]:hover,','[id*="Close"]:hover,','[role="link"]:hover,','[role="link"]:hover *,','[role="button"]:hover *,','[role="menuitem"]:hover,','[role="menuitem"]:hover *,','[id*="button"],',"button,","h1 a,","h2 a,","h3 a,","h4 a,","h5 a,","h6 a,","li,","li a,","link,","path,","select,","selected,","summary,","svg,","th,","use,","#backup-title,","#button,","#icon-label,","#install_style_icon,","#options-heading,","#style_installed_button,","#style_installed_title,","#tabsContent,","#toggleButton,","g-flat-button,","iframe,","paper-button,","paper-button#label,","paper-button.yt-next-continuation,","paper-item,","yt-icon-button,","ytd-single-option-survey-option-renderer,","ytd-toggle-theme-compact-link-renderer,","ytp-bottom,",".arrow,",".arrow-upvote,",".arrow-downvote,",".button,",".c-pointer,",".c-glyph,",".c-heading,",".CeoRYc,",".css_button,",".CwaK9,",".dismiss,",".expando-button,",".fSXkBc,",".gsfs,",".gNO89b,",".hamburger,",".KKjvXb,",".iblpc,",".installed-icon,",".iv-branding .branding-img-container img,",".jsslot,",".lazyloaded,",".less-button,",".link,",".m-cur, .f-cur,",".more-button,",".no-select,",".paper-icon-button,",".paper-toggle-button,",".radio-response,",".RESCloseButton,",".res-step,",".RNmpXc,",".sbsb_c,",".search-button,",".search_button,",".search__button,",".search_image,",".snByac,",".style-name,",".TquXA,",".yt-dropdown-menu,",".yt-simple-endpoint,",".ytd-menu-service-item-renderer,",".ytd-subscribe-button-renderer,",".WnMeTcero48dKo501T-19,","._1B7SUGHK0QDoHimxX2a9D0,","._1rNBkuuOkN2SorEXyRkYjB,","._1RYN-7H8gYctjOQeL8p2Q7,","._1XWObl-3b9tPy64oaG6fax,","._23h0-EcaBUorIHC-JZyh6J,","._28vEaVlLWeas1CDiLuTCap,","._2ED-O3JtIcOqp8iIL1G5cg,","._2FCtq-QzlfuN-SwVMUZMM3,","._2uVDwsKlmWPhYjwe_hYwKZ,","._2XDITKxlj4y3M99thqyCsO,","._2XQ3ZY6qCbEm9_WtvLLFru,","._2y3bja4n4-unxyUrMEFH8C,","._2ZjElFi3ORaU3VPrwmdoCp,","._3-Dc7BBLD7JWsyF3pV-rsH,","._3-miAEojrCvx_4FQ8x3P-s,","._36kpXQ-z7Hr61j8878uRkP,","._3G7xHJZQMrQlpjhNDQI2fe,","._3UAl61hrkRAXX5JQ6m_q8R,","._3UEq__yL-82zX4EyuluREz,","._3u6g9UTYlEOr-yfM5hyq3p,",".cZPZhMe-UCZ8htPodMyJ5,",".D3IyhBGwXo9jPwz-Ka0Ve._1poyrkZ7g36PawDueRza-J,",".Nb7NCPTlQuxN_WDPUg5Q2,",".Ox8QhMwI_pG4DcRAicFqa,",".ssgs3QQidkqeycI33hlBa,",".TmgZY6tDcdErbE5d7E0HJ,",".Ywkt6EDfNWINeTr9lP29","{",'    cursor: url("data:image/png;base64,AAACAAEAGhoAAAUAAABoBwAAFgAAACgAAAAaAAAANAAAAAEACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGRkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAABAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAABAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAQAAAQEAAAAAAAAAAAEAAAEAAAAAAAAAAAAAAAEBAQABAAABAAABAAABAAABAAAAAAAAAAAAAAAAAAAAAQAAAQAAAQAAAQABAAAAAAAAAAAAAAAAAAAAAAEAAAEAAAEAAAEBAAAAAAAAAAAAAAAAAAAAAAABAAABAAABAQEAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAAAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAAAAAAAAAAAAAD////A////wP///8D////A+AH/wPgB/8D4Af/A8AD/wPAA/8DgAP/A4AB/wMAAf8DAAH/AgAB/wAAAf8AAAH/AEAB/wPAA/8DwAf/A8Af/wPA//8Dw///A8P//wPD//8Dw///A+f//wA=="), default !important;',"}","","a:active,","a *:active,","span[onclick]:active,",'[class*="close"]:active,','[class*="Close"]:active,','[id*="close"]:active,','[id*="Close"]:active,','[role="link"]:active,','[role="link"]:active *,','[role="button"]:active *,','[role="menuitem"]:active,','[role="menuitem"]:active *,','[id*="button"]:active,',"button:active,","h1 a:active,","h2 a:active,","h3 a:active,","h4 a:active,","h5 a:active,","h6 a:active,","input a:active,","li:active,","li a:active,","link:active,","path:active,","select:active,","selected:active,","summary:active,","svg:active,","th:active,","use:active,","#backup-title:active,","#button:active,","#icon-label:active,","#install_style_icon:active,","#options-heading:active,","#style_installed_button:active,","#style_installed_title:active,","#tabsContent:active,","#toggleButton:active,","g-flat-button:active,","iframe:active,","paper-button:active,","paper-button#label:active,","paper-button.yt-next-continuation:active,","paper-item:active,","yt-icon-button:active,","ytd-single-option-survey-option-renderer:active,","ytd-toggle-theme-compact-link-renderer:active,","ytp-bottom:active,",".arrow:active,",".arrow-upvote:active,",".arrow-downvote:active,",".button:active,",".c-pointer:active,",".c-glyph:active,",".c-heading:active,",".CeoRYc:active,",".css_button:active,",".CwaK9:active,",".dismiss:active,",".expando-button:active,",".fSXkBc:active,",".gsfs:active,",".gNO89b:active,",".hamburger:active,",".KKjvXb:active,",".iblpc:active,",".installed-icon:active,",".iv-branding .branding-img-container img:active,",".jsslot:active,",".lazyloaded:active,",".less-button:active,",".link:active,",".m-cur:active, .f-cur:active,",".more-button:active,",".no-select:active,",".paper-icon-button:active,",".paper-toggle-button:active,",".player.scrubbing *,",".radio-response:active,",".RESCloseButton:active,",".res-step:active,",".RNmpXc:active,",".sbsb_c:active,",".search-button:active,",".search_button:active,",".search__button:active,",".search_image:active,",".snByac:active,",".style-name:active,",".TquXA:active,",".yt-dropdown-menu:active,",".yt-simple-endpoint:active,",".ytd-menu-service-item-renderer:active,",".ytd-subscribe-button-renderer:active,",".WnMeTcero48dKo501T-19:active,","._1B7SUGHK0QDoHimxX2a9D0:active,","._1rNBkuuOkN2SorEXyRkYjB:active,","._1RYN-7H8gYctjOQeL8p2Q7:active,","._1XWObl-3b9tPy64oaG6fax:active,","._23h0-EcaBUorIHC-JZyh6J:active,","._28vEaVlLWeas1CDiLuTCap:active,","._2ED-O3JtIcOqp8iIL1G5cg:active,","._2FCtq-QzlfuN-SwVMUZMM3:active,","._2uVDwsKlmWPhYjwe_hYwKZ:active,","._2XDITKxlj4y3M99thqyCsO:active,","._2XQ3ZY6qCbEm9_WtvLLFru:active,","._2y3bja4n4-unxyUrMEFH8C:active,","._2ZjElFi3ORaU3VPrwmdoCp:active,","._3-Dc7BBLD7JWsyF3pV-rsH:active,","._3-miAEojrCvx_4FQ8x3P-s:active,","._36kpXQ-z7Hr61j8878uRkP:active,","._3G7xHJZQMrQlpjhNDQI2fe:active,","._3UAl61hrkRAXX5JQ6m_q8R:active,","._3UEq__yL-82zX4EyuluREz:active,","._3u6g9UTYlEOr-yfM5hyq3p:active,",".cZPZhMe-UCZ8htPodMyJ5:active,",".D3IyhBGwXo9jPwz-Ka0Ve._1poyrkZ7g36PawDueRza-J:active,",".Nb7NCPTlQuxN_WDPUg5Q2:active,",".Ox8QhMwI_pG4DcRAicFqa:active,",".ssgs3QQidkqeycI33hlBa:active,",".TmgZY6tDcdErbE5d7E0HJ:active,",".Ywkt6EDfNWINeTr9lP29:active","{",'    cursor: url("data:image/png;base64,AAACAAEAGhoAAAUAAABoBwAAFgAAACgAAAAaAAAANAAAAAEACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAZGRkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAQEBAQAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAABAAEAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAABAAABAAAAAAAAAAAAAAABAAAAAAAAAAAAAAABAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAQAAAQEAAAAAAAAAAAEAAAEAAAAAAAAAAAAAAAEBAQABAAABAAABAAABAAABAAAAAAAAAAAAAAAAAAAAAQAAAQAAAQAAAQABAAAAAAAAAAAAAAAAAAAAAAEAAAEAAAEAAAEBAAAAAAAAAAAAAAAAAAAAAAABAAABAAABAQEAAAAAAAAAAAAAAAAAAAAAAAAAAQEBAQEBAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD////A////wP///8D////A+AH/wPgB/8D4Af/A8AD/wPAA/8DgAP/A4AB/wMAAf8DAAH/AgAB/wAAAf8AAAH/AEAB/wPAA/8DwAf/A8Af/wPA//8D5///A////wP///8D////A////wA=="), default;',"}","","/*Experimental*/","::select,","::selection","{","    cursor: text !important;","}"].join("\n");if(typeof GM_addStyle!="undefined"){GM_addStyle(A)}else if(typeof PRO_addStyle!="undefined"){PRO_addStyle(A)}else if(typeof addStyle!="undefined"){addStyle(A)}else{var e=document.createElement("style");e.type="text/css";e.appendChild(document.createTextNode(A));var t=document.getElementsByTagName("head");if(t.length>0){t[0].appendChild(e)}else{document.documentElement.appendChild(e)}}})();
//rebuild by neat ;
(function webpackUniversalModuleDefinition(root, factory) {
  if (typeof exports === 'object' && typeof module === 'object') module.exports = factory();
  else if (typeof define === 'function' && define.amd) define([], factory);
  else if (typeof exports === 'object') exports["POWERMODE"] = factory();
  else root["POWERMODE"] = factory()
})(this, function () {
  return (function (modules) {
    var installedModules = {};

    function __webpack_require__(moduleId) {
      if (installedModules[moduleId]) return installedModules[moduleId].exports;
      var module = installedModules[moduleId] = {
        exports: {},
        id: moduleId,
        loaded: false
      };
      modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
      module.loaded = true;
      return module.exports
    }
    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.p = "";
    return __webpack_require__(0)
  })([function (module, exports, __webpack_require__) {
    'use strict';
    var canvas = document.createElement('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas.style.cssText = 'position:fixed;top:0;left:0;pointer-events:none;z-index:999999';
    window.addEventListener('resize', function () {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight
    });
    document.body.appendChild(canvas);
    var context = canvas.getContext('2d');
    var particles = [];
    var particlePointer = 0;
    POWERMODE.shake = true;

    function getRandom(min, max) {
      return Math.random() * (max - min) + min
    }

    function getColor(el) {
      if (POWERMODE.colorful) {
        var u = getRandom(0, 360);
        return 'hsla(' + getRandom(u - 10, u + 10) + ', 100%, ' + getRandom(50, 80) + '%, ' + 1 + ')'
      } else {
        return window.getComputedStyle(el).color
      }
    }

    function getCaret() {
      var el = document.activeElement;
      var bcr;
      if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.getAttribute('type') === 'text')) {
        var offset = __webpack_require__(1)(el, el.selectionStart);
        bcr = el.getBoundingClientRect();
        return {
          x: offset.left + bcr.left,
          y: offset.top + bcr.top,
          color: getColor(el)
        }
      }
      var selection = window.getSelection();
      if (selection.rangeCount) {
        var range = selection.getRangeAt(0);
        var startNode = range.startContainer;
        if (startNode.nodeType === document.TEXT_NODE) {
          startNode = startNode.parentNode
        }
        bcr = range.getBoundingClientRect();
        return {
          x: bcr.left,
          y: bcr.top,
          color: getColor(startNode)
        }
      }
      return {
        x: 0,
        y: 0,
        color: 'transparent'
      }
    }

    function createParticle(x, y, color) {
      return {
        x: x,
        y: y,
        alpha: 1,
        color: color,
        velocity: {
          x: -1 + Math.random() * 2,
          y: -3.5 + Math.random() * 2
        }
      }
    }

    function POWERMODE() {
      {
        var caret = getCaret();
        var numParticles = 5 + Math.round(Math.random() * 10);
        while (numParticles--) {
          particles[particlePointer] = createParticle(caret.x, caret.y, caret.color);
          particlePointer = (particlePointer + 1) % 500
        }
      } {
        if (POWERMODE.shake) {
          var intensity = 1 + 2 * Math.random();
          var x = intensity * (Math.random() > 0.5 ? -1 : 1);
          var y = intensity * (Math.random() > 0.5 ? -1 : 1);
          document.body.style.marginLeft = x + 'px';
          document.body.style.marginTop = y + 'px';
          setTimeout(function () {
            document.body.style.marginLeft = '';
            document.body.style.marginTop = ''
          }, 75)
        }
      }
    };
    POWERMODE.colorful = false;

    function loop() {
      requestAnimationFrame(loop);
      context.clearRect(0, 0, canvas.width, canvas.height);
      for (var i = 0; i < particles.length; ++i) {
        var particle = particles[i];
        if (particle.alpha <= 0.1) continue;
        particle.velocity.y += 0.075;
        particle.x += particle.velocity.x;
        particle.y += particle.velocity.y;
        particle.alpha *= 0.96;
        context.globalAlpha = particle.alpha;
        context.fillStyle = particle.color;
        context.fillRect(Math.round(particle.x - 1.5), Math.round(particle.y - 1.5), 3, 3)
      }
    }
    requestAnimationFrame(loop);
    module.exports = POWERMODE
  }, function (module, exports) {
    (function () {
      var properties = ['direction', 'boxSizing', 'width', 'height', 'overflowX', 'overflowY', 'borderTopWidth', 'borderRightWidth', 'borderBottomWidth', 'borderLeftWidth', 'borderStyle', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'fontStyle', 'fontVariant', 'fontWeight', 'fontStretch', 'fontSize', 'fontSizeAdjust', 'lineHeight', 'fontFamily', 'textAlign', 'textTransform', 'textIndent', 'textDecoration', 'letterSpacing', 'wordSpacing', 'tabSize', 'MozTabSize'];
      var isFirefox = window.mozInnerScreenX != null;

      function getCaretCoordinates(element, position, options) {
        var debug = options && options.debug || false;
        if (debug) {
          var el = document.querySelector('#input-textarea-caret-position-mirror-div');
          if (el) {
            el.parentNode.removeChild(el)
          }
        }
        var div = document.createElement('div');
        div.id = 'input-textarea-caret-position-mirror-div';
        document.body.appendChild(div);
        var style = div.style;
        var computed = window.getComputedStyle ? getComputedStyle(element) : element.currentStyle;
        style.whiteSpace = 'pre-wrap';
        if (element.nodeName !== 'INPUT') style.wordWrap = 'break-word';
        style.position = 'absolute';
        if (!debug) style.visibility = 'hidden';
        properties.forEach(function (prop) {
          style[prop] = computed[prop]
        });
        if (isFirefox) {
          if (element.scrollHeight > parseInt(computed.height)) style.overflowY = 'scroll'
        } else {
          style.overflow = 'hidden'
        }
        div.textContent = element.value.substring(0, position);
        if (element.nodeName === 'INPUT') div.textContent = div.textContent.replace(/\s/g, "\u00a0");
        var span = document.createElement('span');
        span.textContent = element.value.substring(position) || '.';
        div.appendChild(span);
        var coordinates = {
          top: span.offsetTop + parseInt(computed['borderTopWidth']),
          left: span.offsetLeft + parseInt(computed['borderLeftWidth'])
        };
        if (debug) {
          span.style.backgroundColor = '#aaa'
        } else {
          document.body.removeChild(div)
        }
        return coordinates
      }
      if (typeof module != "undefined" && typeof module.exports != "undefined") {
        module.exports = getCaretCoordinates
      } else {
        window.getCaretCoordinates = getCaretCoordinates
      }
    }())
  }])
});;
// 注意：live2d_path 参数应使用绝对路径
// const live2d_path = "/live2d-widget/";
const live2d_path = "/live2d-widget/";

// 封装异步加载资源的方法
function loadExternalResource(url, type) {
  return new Promise((resolve, reject) => {
    let tag;

    if (type === "css") {
      tag = document.createElement("link");
      tag.rel = "stylesheet";
      tag.href = url;
    } else if (type === "js") {
      tag = document.createElement("script");
      tag.src = url;
    }
    if (tag) {
      tag.onload = () => resolve(url);
      tag.onerror = () => reject(url);
      document.head.appendChild(tag);
    }
  });
}

// 加载 waifu.css live2d.min.js waifu-tips.js
if (screen.width >= 768) {
  Promise.all([
    loadExternalResource(live2d_path + "waifu.css", "css"),
    loadExternalResource(live2d_path + "live2d.min.js", "js"),
    loadExternalResource(live2d_path + "waifu-tips.js", "js")
  ]).then(() => {
    initWidget({
      waifuPath: live2d_path + "waifu-tips.json",
      apiPath: "https://live2d.fghrsh.net/api/",
      //cdnPath: "https://cdn.jsdelivr.net/gh/fghrsh/live2d_api/"
    });
  });
}
// initWidget 第一个参数为 waifu-tips.json 的路径，第二个参数为 API 地址
// API 后端可自行搭建，参考 https://github.com/fghrsh/live2d_api
// 初始化看板娘会自动加载指定目录下的 waifu-tips.json

console.log(`
  く__,.ヘヽ.        /  ,ー､ 〉
           ＼ ', !-─‐-i  /  /´
           ／｀ｰ'       L/／｀ヽ､
         /   ／,   /|   ,   ,       ',
       ｲ   / /-‐/  ｉ  L_ ﾊ ヽ!   i
        ﾚ ﾍ 7ｲ｀ﾄ   ﾚ'ｧ-ﾄ､!ハ|   |
          !,/7 '0'     ´0iソ|    |
          |.从"    _     ,,,, / |./    |
          ﾚ'| i＞.､,,__  _,.イ /   .i   |
            ﾚ'| | / k_７_/ﾚ'ヽ,  ﾊ.  |
              | |/i 〈|/   i  ,.ﾍ |  i  |
             .|/ /  ｉ：    ﾍ!    ＼  |
              kヽ>､ﾊ    _,.ﾍ､    /､!
              !'〈//｀Ｔ´', ＼ ｀'7'ｰr'
              ﾚ'ヽL__|___i,___,ンﾚ|ノ
                  ﾄ-,/  |___./
                  'ｰ'    !_,.:
`);
;
// build time:Thu Apr 30 2020 11:10:13 GMT+0800 (GMT+08:00)
var OriginTitle=document.title;var titleTime;document.addEventListener("visibilitychange",function(){if(document.hidden){$('[rel="icon"]').attr("href","/img/TEP.ico");document.title="╭(°A°`)╮ 不要走啦 ~";clearTimeout(titleTime)}else{$('[rel="icon"]').attr("href","/images/avatar.png");document.title="(ฅ>ω<*ฅ) 噫~ 来啦老弟 ~";titleTime=setTimeout(function(){document.title=OriginTitle},2e3)}});
//rebuild by neat 