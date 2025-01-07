// ==UserScript==
// @name         YouTube MP3 Downloader
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Add a button to download YouTube videos as MP3 using ezmp3.
// @author       Your Name
// @match        https://www.youtube.com/*
// @match        https://ezmp3.cc/v3
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// ==/UserScript==

(function () {
    'use strict';

    let currentUrl = window.location.href;

    // Function to add the Download MP3 button
    function addDownloadButtonToLikeDislikeUI() {
        if (document.getElementById('downloadMp3Button')) return;

        if (!document.querySelector("#button-shape > button > yt-touch-feedback-shape > div > div.yt-spec-touch-feedback-shape__fill")) {
            console.log("ran")
            setTimeout(addDownloadButtonToLikeDislikeUI, 500);
            return;
        }

        const button = document.createElement('button');
        button.id = 'downloadMp3Button';
        button.innerText = 'MP3';
        button.classList.add('yt-spec-button-shape-next', 'yt-spec-button-shape-next--tonal', 'yt-spec-button-shape-next--mono', 'yt-spec-button-shape-next--size-m', 'yt-spec-button-shape-next--icon-leading');
        button.style.marginLeft = '10px';

        button.addEventListener('click', () => {
            const videoUrl = window.location.href;
            if (videoUrl) {
                GM_setValue('youtubeVideoUrl', videoUrl);

                // Open the popup window at the bottom-right corner
                const screenWidth = window.screen.width;
                const screenHeight = window.screen.height;
                const popupWidth = window.screen.width*0.03;
                const popupHeight = window.screen.height*0.03;

                const popupWindow = window.open(
                    'https://ezmp3.cc/v3',
                    '_blank',
                    `width=${popupWidth},height=${popupHeight},top=9999,left=9999`
                );

                if (!popupWindow) {
                    alert('Failed to open popup. Please check your browser settings.');
                    return;
                }

                monitorPopupWindow(popupWindow);
            } else {
                alert('Failed to retrieve the video URL.');
            }
        });

        document.querySelector('#top-level-buttons-computed').appendChild(button);
        document.querySelector("#menu > ytd-menu-renderer").style.maxHeight = '0';
        document.querySelector("#menu > ytd-menu-renderer").style.maxHeight = '36px';
    }

    // Monitor the popup window's status
    function monitorPopupWindow(popup) {
        const timeout = 20000; // 20 seconds
        const intervalTime = 500;
        let elapsed = 0;

        const interval = setInterval(() => {
            if (!popup || popup.closed) {
                clearInterval(interval);
                console.log('Popup window has closed.');
                return;
            }

            elapsed += intervalTime;

            if (elapsed >= timeout) {
                clearInterval(interval);
                alert('The MP3 download did not complete within 20 seconds. Please try again.');
                if (popup && !popup.closed) popup.close();
            }
        }, intervalTime);
    }

    // Functionality for ezmp3.cc
    if (window.location.href.includes('https://ezmp3.cc/v3')) {
        const videoUrl = GM_getValue('youtubeVideoUrl');
        if (videoUrl) {
            const setInputValue = (inputField, value) => {
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                    window.HTMLInputElement.prototype,
                    'value'
                ).set;
                nativeInputValueSetter.call(inputField, value);

                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                inputField.dispatchEvent(inputEvent);
            };

            const checkElements = setInterval(() => {
                const inputField = document.querySelector("#\\:r1\\:");
                const convertButton = document.querySelector("#\\:r4\\:");

                if (inputField && convertButton) {
                    clearInterval(checkElements);

                    try {
                        setInputValue(inputField, videoUrl);

                        setTimeout(() => {
                            convertButton.click();

                            // Monitor the download button after clicking "Convert"
                            monitorDownloadButton();
                        }, 1000);
                    } catch (error) {
                        console.error('Error setting input value:', error);
                    }
                }
            }, 500);
        } else {
            console.error('No video URL found. Please initiate the download from a YouTube video.');
        }
    }

    // Monitor the download button and click it automatically
    function monitorDownloadButton() {
        const timeout = 20000; // 20 seconds
        const intervalTime = 500;
        let elapsed = 0;

        const interval = setInterval(() => {
            const downloadButton = document.querySelector(
                "body > div > main > div > div.MuiBox-root.css-4qgjo8 > div.MuiBox-root.css-12gzxi > div > div.MuiGrid-root.MuiGrid-item.MuiGrid-grid-xs-12.MuiGrid-grid-md-4.css-j6tcf3 > button"
            );

            if (downloadButton) {
                clearInterval(interval);
                downloadButton.click();
                console.log('Download button clicked.');

                // Close the popup window after clicking the download button
                setTimeout(() => {
                    if (!window.closed) window.close();
                }, 2000);
                return;
            }

            elapsed += intervalTime;
            if (elapsed >= timeout) {
                clearInterval(interval);
                alert('Download button was not found within 20 seconds.');
            }
        }, intervalTime);
    }

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList' || mutation.type === 'subtree') {
                currentUrl = window.location.href;
                addDownloadButtonToLikeDislikeUI();
            }
        });
    });

    // Start observing the document body for changes
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Add the button on initial load
    addDownloadButtonToLikeDislikeUI();
})();
