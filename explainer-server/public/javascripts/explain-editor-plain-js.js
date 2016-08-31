/*
 * This function was put here at opposition to within the scala code because
 * the read operation of the text area content uses cached values in the JS code generated by ScalaJS.
 */
function getBodyWordCount(){
    var trimmedInnerText = $.trim($(".scribe-body-editor__textarea")[0].innerText);
    return trimmedInnerText.split(" ").length;
}
const maxWordCount = 150;
function updateWordCountDisplay() {
    $(".word-count__number").text(getBodyWordCount())
}
function updateWordCountWarningDisplay() {
    if (getBodyWordCount() > maxWordCount) {
        $(".word-count__message").show();
    } else {
        $(".word-count__message").hide();
    }
}
function updateStatusBar(message){
    var status = $(".content-status"),
        statusMessage = $(".content-message"),
        labelClass = "",
        labelStatus = "",
        labelMessage = "";

    if (message.length) {
        switch(message) {
            case "published":
                labelClass = "label--success";
                labelStatus = "Available";
                break;
            case "draft":
                labelClass="label--warning";
                labelStatus = "Draft";
                break;
            case "unseen":
                labelStatus = "Available";
                labelClass = "label--success";
                labelMessage = "Unlaunched Changes";
                break;

        }

        status.text(labelStatus)
            .removeClass()
            .addClass("label")
            .addClass(labelClass)
            .show();

        if (labelMessage) {
            statusMessage.text(labelMessage)
                .show();
        } else {
            statusMessage.hide();
        }

    } else {
        status.hide();
        statusMessage.hide();
    }
}

function updateInteractiveURL(url){
    $("#interactive-url-text").text(url)
}

/*
 * This function was put here at opposition to within the scala code because
 * the read operation of the text input uses cached values in the JS code generated by ScalaJS.
 */
function updateCheckboxState() {
    var $this = $("#expandable");
    if ($this.is(':checked')) {
        ExplainEditorJS().setDisplayType(EXPLAINER_IDENTIFIER,"Expandable")
    } else {
        ExplainEditorJS().setDisplayType(EXPLAINER_IDENTIFIER,"Flat")
    }
};

/*
 * Tag Search
 */

$(document).delegate( ".explainer-editor__tags-common__tag-delete-icon", "click", function() {
    var explainerId = $(this).data("explainer-id");
    var tagId = $(this).data("tag-id");
    ExplainEditorJS().removeTagFromExplainer(explainerId,tagId);
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
    requireRenamed(['scribe', 'scribe-plugin-toolbar', 'scribe-plugin-link-prompt-command', 'scribe-plugin-keyboard-shortcuts', 'scribe-plugin-sanitizer'],
        function (Scribe, scribePluginToolbar, scribePluginLinkPromptCommand, scribePluginkeyboardShorcuts, scribePluginSanitizer) {

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
                    li: {}
                }
            }));
            
            scribe.on('content-changed', function() {
                $(".save-state").addClass("save-state--loading");
            });

            scribe.on('content-changed',  debounce(function() {
                var bodyString = scribeElement.innerHTML;
                updateWordCountDisplay();
                updateWordCountWarningDisplay();
                ExplainEditorJS().updateBodyContents(EXPLAINER_IDENTIFIER, bodyString);
                $(".save-state").removeClass("save-state--loading");
            }, 500));

        });
}

function afterDOMRendered() {
    setupScribe();
    updateWordCountDisplay();
    updateWordCountWarningDisplay();
    setInterval(function(){
        ExplainEditorJS().presenceEnterDocument(EXPLAINER_IDENTIFIER);
    },2000);
}

ExplainEditorJS().main(EXPLAINER_IDENTIFIER, afterDOMRendered);

