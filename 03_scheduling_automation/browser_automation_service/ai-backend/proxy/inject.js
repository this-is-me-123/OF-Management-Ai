console.clear = () => console.log('[InjectScript] Console was cleared by the page');
const i = setInterval(() => {
    if (window.turnstile) {
        clearInterval(i);
        console.log('[InjectScript] Turnstile object found. Overriding render method.');
        window.turnstile.render = (a, b) => {
            let params = {
                sitekey: b.sitekey,
                pageurl: window.location.href,
                data: b.cData, // Essential for Turnstile
                pagedata: b.chlPageData, // Essential for Turnstile
                action: b.action,
                userAgent: navigator.userAgent,
                json: 1
            };
            // Log the intercepted parameters for Puppeteer to catch
            console.log('intercepted-params:' + JSON.stringify(params));
            // Store the original callback globally so Puppeteer can call it
            window.cfCallback = b.callback;
            console.log('[InjectScript] Turnstile render intercepted. Callback stored. Waiting for token.');
            // Return a dummy value or nothing, as the original render won't proceed as usual
            return;
        };
    } else {
        // console.log('[InjectScript] Waiting for Turnstile object...');
    }
}, 50);
