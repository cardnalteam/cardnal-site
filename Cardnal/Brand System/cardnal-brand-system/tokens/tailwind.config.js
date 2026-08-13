/** Cardnal Design System — Tailwind mapping (v1.0)
 *  Extends rather than replaces, so Tailwind's utilities still work
 *  but `bg-red-500`, `shadow-float`, and `font-display` resolve to the system. */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        red: {
          50:'#FFF1F2',100:'#FFE0E3',200:'#FFC5CB',300:'#FF9BA6',400:'#F85567',
          500:'#E60B21',600:'#C90A1C',700:'#A80A18',800:'#8A0914',900:'#6B0710',950:'#3D0409',
        },
        ink: {
          50:'#F7F8F9',100:'#EEF0F2',200:'#E1E4E8',300:'#C7CCD3',400:'#9AA1AB',
          500:'#6B727C',600:'#4C525A',700:'#343940',800:'#1E2126',900:'#131519',950:'#0B0C0E',
        },
        success:{ DEFAULT:'#0E9F5B', text:'#097A44', fill:'#08703E', bg:'#E9F8F0' },
        warning:{ DEFAULT:'#B26A00', text:'#9A5C00', bg:'#FDF3E3' },
        alert:  { DEFAULT:'#A61B2B', bg:'#FCEDEF' },
        info:   { DEFAULT:'#1B63C7', bg:'#EBF2FD' },
        gold:'#B8892B', slate2:'#5A6472',
        paper:'#FFFFFF', canvas:'#FAFBFC',
        line:{ DEFAULT:'#E6E8EC', strong:'#D3D8DF' },
      },
      fontFamily: {
        display:['Archivo','system-ui','sans-serif'],
        sans:['Instrument Sans','system-ui','sans-serif'],
        mono:['JetBrains Mono','ui-monospace','monospace'],
      },
      fontSize: {
        display:['clamp(48px,6vw,76px)',{ lineHeight:'0.96', letterSpacing:'-0.045em' }],
        h1:['44px',{ lineHeight:'1.04', letterSpacing:'-0.04em' }],
        h2:['34px',{ lineHeight:'1.12', letterSpacing:'-0.03em' }],
        h3:['26px',{ lineHeight:'1.2',  letterSpacing:'-0.025em' }],
        h4:['20px',{ lineHeight:'1.3',  letterSpacing:'-0.02em' }],
        h5:['17px',{ lineHeight:'1.4',  letterSpacing:'-0.015em' }],
        h6:['14px',{ lineHeight:'1.45', letterSpacing:'-0.01em' }],
        'body-lg':['18px',{ lineHeight:'1.62' }],
        body:['16px',{ lineHeight:'1.6' }],
        small:['14px',{ lineHeight:'1.5' }],
        caption:['12.5px',{ lineHeight:'1.45', letterSpacing:'0.01em' }],
        overline:['11px',{ lineHeight:'1.3', letterSpacing:'0.14em' }],
        data:['14px',{ lineHeight:'1.4' }],
      },
      borderRadius:{ sm:'6px', md:'10px', lg:'14px', xl:'20px', '2xl':'28px' },
      boxShadow:{
        sm:'0 1px 2px rgba(11,12,14,.06), 0 1px 1px rgba(11,12,14,.04)',
        md:'0 4px 12px -2px rgba(11,12,14,.08), 0 2px 4px -2px rgba(11,12,14,.05)',
        lg:'0 12px 28px -8px rgba(11,12,14,.12), 0 4px 8px -4px rgba(11,12,14,.06)',
        float:'0 24px 56px -16px rgba(11,12,14,.18), 0 8px 16px -8px rgba(11,12,14,.08)',
        brand:'0 8px 22px -8px rgba(230,11,33,.5)',
      },
      transitionDuration:{ instant:'80ms', fast:'140ms', base:'200ms', slow:'320ms', deliberate:'480ms' },
      transitionTimingFunction:{
        out:'cubic-bezier(.2,.7,.3,1)',
        'in':'cubic-bezier(.5,0,.9,.4)',
        spring:'cubic-bezier(.2,.9,.25,1.15)',
      },
    },
  },
  plugins: [],
}
