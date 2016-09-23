var explainEditor = views.ExplainEditor();

/*
 * This function was put here at opposition to within the scala code because
 * the read operation of the text area content uses cached values in the JS code generated by ScalaJS.
 */
function getBodyWordCount(){

    var elem = $(".scribe-body-editor__textarea").clone()
    var notes = elem.find("gu-note")
    notes.remove()
    var innerText = elem[0].innerText;

    var words = $.trim(innerText).split(/[.!?\s]+/).filter(function (string) {
        return string != "\u200B";
      })
   
    if (!words.length){
        return 0;
    }
    return words.length
}
const maxWordCount = 100;
function updateWordCountDisplay() {
    var count = getBodyWordCount(),
        sentence = ( count===0 || count>1 ) ? count+" words" : count+" word";
    $(".word-count__number").text(sentence)
}
function updateWordCountWarningDisplay() {
    var msg = $(".word-count__message");
    if ( (getBodyWordCount()>maxWordCount) && !$("#expandable").is(':checked') ) {
        msg.show();
        msg.text("Too long for flat explainer");
    } else {
        msg.hide();
        msg.text("");
    }
}

/*
 * This function was put here at opposition to within the scala code because
 * the read operation of the text input uses cached values in the JS code generated by ScalaJS.
 */
function updateCheckboxState() {
    var $this = $("#expandable");
    if ($this.is(':checked')) {
        explainEditor.setDisplayType(CONFIG.EXPLAINER_IDENTIFIER,"Expandable")
    } else {
        explainEditor.setDisplayType(CONFIG.EXPLAINER_IDENTIFIER,"Flat")
    }
    updateWordCountWarningDisplay();
}

/*
 * Tag Search
 */

$(document).delegate( ".explainer-editor__tags-common__tag-delete-icon", "click", function() {
    var explainerId = $(this).data("explainer-id");
    var tagId = $(this).data("tag-id");
    explainEditor.removeTagFromExplainer(explainerId,tagId);
});

/*
 * Generic Functions
 */

/* Returns a function, that, as long as it continues to be invoked, will not
 * be triggered. The function will be called after it stops being called for
 * N milliseconds. If `immediate` is passed, trigger the function on the
 * leading edge, instead of the trailing.
 */
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function readValueAtDiv(id){
    return $("#"+id).val();
}

function setupScribe() {
    requireRenamed(['scribe', 'scribe-plugin-toolbar', 'scribe-plugin-link-prompt-command', 'scribe-plugin-keyboard-shortcuts', 'scribe-plugin-sanitizer', '/assets/lib/scribe-plugin-noting/scribe-plugin-noting.js'],
        function (Scribe, scribePluginToolbar, scribePluginLinkPromptCommand, scribePluginkeyboardShorcuts, scribePluginSanitizer, scribePluginNoting) {

            var scribeElement = document.querySelector('.scribe-body-editor__textarea');

            // Create an instance of Scribe
            var scribe = new Scribe(scribeElement);

            var toolbarElement = document.querySelector('.scribe-body-editor__toolbar');

            scribe.use(scribePluginToolbar(toolbarElement));
            scribe.use(scribePluginLinkPromptCommand());

            scribe.use(scribePluginkeyboardShorcuts({
                bold: function (event) { return event.metaKey && event.keyCode === 66; }, // b
                italic: function (event) { return event.metaKey && event.keyCode === 73; }, // i
                linkPrompt: function (event) { return event.metaKey && !event.shiftKey && event.keyCode === 75; }, // k
                unlink: function (event) { return event.metaKey && event.shiftKey && event.keyCode === 75; } // shft + k
            }));

            var noteElConfig = {
                'class': true,
                'title': true,
                'data-note-edited-by': true,
                'data-note-edited-date': true,
                'data-note-id': true,
                'data-click-action': true
            };

            scribe.use(scribePluginSanitizer({
                tags: {
                    p: {},
                    i: {},
                    b: {},
                    a: {
                        href: true
                    },
                    ul: {},
                    ol: {},
                    li: {},
                    "gu-note": noteElConfig,
                    "gu-flag": noteElConfig,
                    "gu-correct": noteElConfig
                }
            }));

            var userName = CONFIG.USER_FIRSTNAME + ' ' + CONFIG.USER_LASTNAME;

            var notingConfig = {
                user: userName,
                scribeInstanceSelector: '.scribe-body-editor__textarea',
                selectors: [
                    { commandName: 'note',    tagName: 'gu-note',    clickAction: 'collapse',   keyCodes: [119, 121] }
                ]
            };
            notingConfig.selectors = [
                { commandName: 'note',    tagName: 'gu-note',    clickAction: 'collapse',   keyCodes: [119, 121] },
                { commandName: 'flag',    tagName: 'gu-flag',    clickAction: 'toggle-tag', toggleTagTo: 'gu-correct', keyCodes: [117] },
                { commandName: 'correct', tagName: 'gu-correct', clickAction: 'toggle-tag', toggleTagTo: 'gu-flag', keyCodes: [118] }
            ];
            scribe.use(scribePluginNoting(notingConfig));


            scribe.on('content-changed', function() {
                $(".save-state").addClass("save-state--loading");
            });

            scribe.on('content-changed',  debounce(function() {
                var bodyString = scribeElement.innerHTML;
                updateWordCountDisplay();
                updateWordCountWarningDisplay();
                explainEditor.updateBodyContents(CONFIG.EXPLAINER_IDENTIFIER, bodyString);
                $(".save-state").removeClass("save-state--loading");
            }, 500));

        });
}

function afterDOMRendered() {
    setupScribe();
    updateWordCountDisplay();
    updateWordCountWarningDisplay();
    if (CONFIG.PRESENCE_ENABLED) {
        setInterval(function(){
            explainEditor.presenceEnterDocument(CONFIG.EXPLAINER_IDENTIFIER);
        },2000);
    }

}

explainEditor.main(CONFIG.EXPLAINER_IDENTIFIER, afterDOMRendered);

