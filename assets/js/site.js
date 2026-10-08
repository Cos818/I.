/* BOF BANK site scripts. Every block checks for the elements it needs,
   so the same file runs on the home page and on every subpage. */

/* Mobile navigation toggle */
(function(){
  var btn=document.querySelector('.nav-toggle');
  var links=document.getElementById('navlinks');
  if(!btn||!links)return;
  btn.addEventListener('click',function(){
    var open=links.classList.toggle('open');
    btn.setAttribute('aria-expanded',open?'true':'false');
  });
  links.addEventListener('click',function(e){
    if(e.target.tagName==='A'){links.classList.remove('open');btn.setAttribute('aria-expanded','false');}
  });
  document.addEventListener('keydown',function(e){
    if(e.key==='Escape'&&links.classList.contains('open')){links.classList.remove('open');btn.setAttribute('aria-expanded','false');btn.focus();}
  });
})();

/* Contact form: send in the background and confirm on the page */
(function(){
  var f=document.querySelector('.contact-form');
  if(!f||!window.fetch)return;
  f.addEventListener('submit',function(e){
    e.preventDefault();
    var btn=f.querySelector('button[type="submit"]');
    if(btn){btn.disabled=true;btn.textContent='Sending...';}
    var v=function(id){var el=document.getElementById(id);return el?el.value:''};
    fetch('https://formsubmit.co/ajax/info@bofbank.com',{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({
        Name:v('cf-name'),Company:v('cf-company'),Email:v('cf-email'),Message:v('cf-message'),
        _subject:'BOF BANK website enquiry',_template:'table',_captcha:'false'
      })
    }).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(){
      f.innerHTML='<p class="cf-success">Message sent successfully.<br>We will be in touch shortly.</p>';
    }).catch(function(){
      if(btn){btn.disabled=false;btn.textContent='Contact Us';}
      var er=f.querySelector('.cf-error');
      if(!er){er=document.createElement('p');er.className='cf-error';er.textContent='Could not send right now. Please email info@bofbank.com directly.';f.appendChild(er);}
    });
  });
})();

/* Same-page anchor links scroll directly (avoids sandboxed viewers hijacking navigation) */
document.addEventListener('click',function(e){
  var a=e.target.closest?e.target.closest('a[href^="#"]'):null;
  if(!a)return;
  var id=a.getAttribute('href').slice(1);
  if(!id)return;
  var el=document.getElementById(id);
  if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth'});}
});

/* Pinned "what we do" choreography (home page) */
(function(){
  var track=document.getElementById('choreo-track');
  var sticky=document.getElementById('choreo-sticky');
  if(!track||!sticky)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var current=-1,ticking=false;
  function update(){
    ticking=false;
    var r=track.getBoundingClientRect();
    var vh=window.innerHeight;
    var scrollable=r.height-vh;
    var p=scrollable>0?Math.min(1,Math.max(0,-r.top/scrollable)):0;
    var step=Math.min(1,Math.floor(p*2));
    if(step!==current){
      sticky.classList.remove('step-0','step-1');
      sticky.classList.add('step-'+step);
      current=step;
    }
  }
  function onScroll(){if(!ticking){ticking=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',onScroll,{passive:true});
  window.addEventListener('resize',onScroll,{passive:true});
  update();
})();
(function(){
  var title=document.getElementById('choreo-title');
  var sticky=document.getElementById('choreo-sticky')||(title&&title.parentElement);
  if(!title||!sticky)return;
  var wio=new IntersectionObserver(function(es){
    es.forEach(function(e){
      if(e.isIntersecting){title.classList.add('play');}
      else{title.classList.remove('play');}
    });
  },{threshold:.6});
  wio.observe(sticky);
})();

/* Rotating wealth photographs (home page) */
(function(){
  var imgs=document.querySelectorAll('.arch-img');
  if(imgs.length<2)return;
  if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  var i=0;
  setInterval(function(){
    imgs[i].classList.remove('active');
    i=(i+1)%imgs.length;
    imgs[i].classList.add('active');
  },1300);
})();

/* Reveal on scroll */
(function(){
  if(!('IntersectionObserver' in window))return;
  var io=new IntersectionObserver(function(entries){
    entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);}});
  },{threshold:.12});
  document.querySelectorAll('.reveal').forEach(function(el){io.observe(el)});
  /* Safety net: if the observer never fires (limited viewers), show everything */
  setTimeout(function(){
    var pending=document.querySelectorAll('.reveal:not(.in)');
    var anyIn=document.querySelector('.reveal.in');
    if(!anyIn){pending.forEach(function(el){el.classList.add('in')});}
  },1500);
})();

/* Header: solid once the page is scrolled */
(function(){
  var h=document.querySelector('header');if(!h)return;
  function upd(){h.classList.toggle('scrolled',window.scrollY>40);}
  window.addEventListener('scroll',upd,{passive:true});upd();
})();
