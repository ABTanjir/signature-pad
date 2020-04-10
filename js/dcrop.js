// gather all dcrop dependencies and append on webpage
var dependencies =
    '<!-- light-modal -->'
    + '<link href="https://cdn.jsdelivr.net/gh/hunzaboy/Light-Modal@latest/dist/css/light-modal.css" rel="stylesheet">'
    + '<!-- animate.css -->'
    + '<link href="https://cdn.jsdelivr.net/gh/daneden/animate.css@latest/animate.css" rel="stylesheet">'
    + '<!-- canvas-toBlob.js -->'
    + '<script src="https://cdn.jsdelivr.net/gh/eligrey/canvas-toBlob.js@latest/canvas-toBlob.js" defer></script>'
    + '<!-- FileSaver.js -->'
    + '<script src="https://cdn.jsdelivr.net/gh/eligrey/FileSaver.js@latest/dist/FileSaver.js" defer></script>'
    + '<!-- Croppr.js -->'
    + '<link href="https://cdn.jsdelivr.net/gh/jamesssooi/Croppr.js@latest/dist/croppr.css" rel="stylesheet">'
    + '<script src="https://cdn.jsdelivr.net/gh/jamesssooi/Croppr.js@latest/dist/croppr.js"></script>';
$("body").after(dependencies);

// used jQuery.fn.extend() method to provide new methods that can be chained to the jQuery() function
// in our case - $(element).dcrop()
jQuery.fn.extend({
  dcrop: function (options = {
        
        aspectRatio: null,
        maxSize: null,
        minSize: null,
        startSize: [100, 100, '%'],
        sigHeight: 100,
        sigWidth: 300,
        onCropStart: null,
        onCropMove: null,
        onCropEnd: null,
        onInitialize: null,
        modalAnimation: '',
        allowedInputs: ['gif','png','jpg','jpeg'], // input extensions supported
        imageExtension: 'image/jpeg', // cropped image/blob file-type 'image/jpeg' | 'image/png' | any other supported by browser
        returnImageMode: 'data-url', // image data mode, 'blob' for blob object or 'data-url' for dataURL
    }) {
        var dcropSig = '';
        dcropSig+='<span style="display:inline-block; position:absolute; padding:4px;"><button class="signature"> </button>';
        dcropSig+='<button class="upload-signature"> </button></span>';
        $(this).parent('div').append(dcropSig);
        $(this).each(function(){
            var c = '<canvas class="'+$(this).attr('id')+'" data-dcrop="'+$(this).attr('id')+'" width="'+options.sigWidth+'" height="'+options.sigHeight+'"></canvas>';
            $(this).closest('div').append(c);
        })
        // create canvas for each elements
        // <canvas id="undefined" class="image-previewer" data-dcrop="dcrop-input"></canvas>
        // $(this).parent('div').append('<canvas id="aa" class="aa" data-dcrop="aaa"></canvas>');
        var _self   = $(this);
        var _container = $(this).parent('div');
        var _canvas = null;
        var btn_draw_signature = _container.find('.signature')
        var btn_upload_signature = _container.find('.upload-signature')
        
        _self.parent('div').addClass('signature-pad-container');
        _self.hide();
        btn_draw_signature.css({
            'height': (options.sigHeight/2) - 5,
            'width': (options.sigHeight/2) - 5,
        });
        btn_upload_signature.css({
            'height': (options.sigHeight/2) - 5,
            'width': (options.sigHeight/2) - 5,
        });


        if (options.aspectRatio <= 0) {
            options.aspectRatio = null;
        }
        if (!options.allowedInputs) {
            options.allowedInputs = ['gif','png','jpg','jpeg'];
        }
        if (!options.imageExtension) {
            options.imageExtension = 'image/jpeg';
        }
        if (!options.returnImageMode) {
            options.returnImageMode = 'data-url';
        }
        // function to reset input (value) of input, taking in input id
        // resets input value of dcrop input type=file so that same file can be selected twice
        function resetFileInput(id) {
            $('#' + id).val(null);
        }
        // function to get the cropped/selected image-data as blob or dataURL
        // it takes in the input id to return data for specific input
        // it returns dataURL or blob
        window.dcropGetImage = function(id) {
            return dcropReturnImage[id];
        }
        // function to rotate image in modal, taking in input id
        // it disables croppr, creates a new image object after rotating the canvas then initializes croppr again
        window.dcropRotateImage = function(id) {
            // using hidden canvas and modal image
            dcropCroppr.destroy();
            setTimeout(function(){
                var canvas = document.getElementById('dcrop-hidden-canvas');
                var ctx = canvas.getContext('2d');
                // get current image data
                var urlData = canvas.toDataURL();
                // create image object to draw in canvas
                var img = new Image();
                img.src = urlData;
                // save context
                ctx.save();
                // translate so rotation happens at center of image
                ctx.translate(dcropCanvasWidth * 0.5, dcropCanvasHeight * 0.5);
                // rotate canvas context
                ctx.rotate(1.5708);
                // translate back so next draw happens in upper left corner
                ctx.translate(-dcropCanvasWidth * 0.5, -dcropCanvasHeight * 0.5);
                // image will now be drawn rotated
                ctx.drawImage(img, 0, 0);
                // restore context
                ctx.restore();
                // settimeout to allow time between destroying and initializing croppr
                setTimeout(function(){
                    // get new image data and set it into created image
                    urlData = canvas.toDataURL();
                    img.src = urlData;
                    // let imageElement = '<img id="dcrop-modal-image" src="' + urlData + '">';
                    // $('div.light-modal-body').append(imageElement);
                    // change modal image data
                    $('#dcrop-modal-image').attr('src', urlData);
                    // initialize croppr.js on modal-image again, with all the specified options
                    dcropCroppr = new Croppr('#dcrop-modal-image', {
                        aspectRatio: options.aspectRatio,
                        maxSize: options.maxSize,
                        minSize: options.minSize,
                        startSize: options.startSize,
                        sigHeight: options.sigHeight,
                        sigWidth: options.sigWidth,
                        onCropStart: options.onCropStart,
                        onCropMove: options.onCropMove,
                        onCropEnd: options.onCropEnd,
                        onInitialize: options.onInitialize,
                        onCropMove: options.onCropMove,
                    });
                }, 50);
            }, 50);
        }
        // function to crop the modal-image and display it on the hidden canvas and other dynamic canvases (previewers)
        window.dcropCreateImage = function(id) {
            // get croppr.js dimensions
            var dimensions = dcropCroppr.getValue();
            // get hidden canvas and draw cropped image onto it
            var canvas = document.getElementById('dcrop-hidden-canvas');
            var ctx = canvas.getContext('2d');
            ctx.canvas.width = dimensions.width;
            ctx.canvas.height = dimensions.height;
            var img = document.getElementsByClassName('croppr-image')[0];
            ctx.drawImage(img, dimensions.x, dimensions.y, dimensions.width, dimensions.height, 0, 0, dimensions.width, dimensions.height);
            // draw on previewers
            /*******************************************************************************************/
            //---------------- DEBUD NOTE---------> There is previewer
            /*******************************************************************************************/
            for (let i = 0; i < dcropPreviewersLength; i++) {
                dcropPreviewCanvasContext[i].canvas.width = options.sigWidth;
                dcropPreviewCanvasContext[i].canvas.height = options.sigHeight;
                dcropPreviewCanvasContext[i].drawImage(img, dimensions.x, dimensions.y, dimensions.width, dimensions.height, 0, 0, options.sigWidth,  options.sigHeight);
            }
            // store image data as blob or dataURL for retrieval
            if (options.returnImageMode == 'blob') {
                canvas.toBlob(function(blob){
                    window.dcropReturnImage = [];
                    dcropReturnImage[id] = blob;
                }, options.imageExtension);
            } else {
                window.dcropReturnImage = [];
                dcropReturnImage[id] = canvas.toDataURL(options.imageExtension);
            }
            // cropping finished, close modal
            closeModal();
        }

        window.dcropCreateSignature = function() {

        }

        
        $(document).on('click', '.upload-signature', function(e){
            $(this).parent().parent('.signature-pad-container').find('input').trigger('click');
        });

        $(document).on('click', '.light-modal-close-btn', function(){
            var dest_canvas_class = '.'+$(this).data('dest');
            var sourceCanvas = $('.sign-pad')[0];
            var destCanvas = $(dest_canvas_class)[0];
            if(!destCanvas) return false;
            // var destCtx = destCanvas.getContext('2d');
            // destCtx.drawImage(sourceCanvas, 0, 0);
            // console.log(dest_canvas_class);
            // console.log(sourceCanvas);
            // console.log(destCanvas);
            
            //set dimensions
            // destCanvas.width = sourceCanvas.width;
            // destCanvas.height = sourceCanvas.height;
            
            //apply the old canvas to the new one
            // context.drawImage(sourceCanvas, 0, 0, sourceCanvas.width, sourceCanvas.height,
            //                 0, 0, destCanvas.width, destCanvas.height);
            if($(this).hasClass('signature_canvas_')){
                var context = destCanvas.getContext('2d');
                drawImageScaled(sourceCanvas, context)
                // console.log('closing image modal')
                var imgData = sourceCanvas.toDataURL('image/png');
            }else{
                var imgData = destCanvas.toDataURL('image/png');
            }
            var _svg_input = $(destCanvas).parent('div').find('[data-content="'+$(this).data('dest')+'"]');
            console.log('aaaaaaaaaaaa');
            if(_svg_input.length > 0){
                $(_svg_input).val(imgData);
            }else{
                $(destCanvas).parent('div').append('<input type="hidden" value="'+imgData+'" name="'+$(this).data('dest')+'"  data-content="'+$(this).data('dest')+'"> ');
            }
			// var windowOpen = window.open('about:blank', 'Image');
			// windowOpen.document.write('<img src="' + imgData + '" alt="Exported Image"/>');
            // cropping finished, close modal
            closeModal();
        });

        function drawImageScaled(img, ctx) {
            var canvas = ctx.canvas ;
            var hRatio = canvas.width  / img.width    ;
            var vRatio =  canvas.height / img.height  ;
            var ratio  = Math.min ( hRatio, vRatio );
            var centerShift_x = ( canvas.width - img.width*ratio ) / 2;
            var centerShift_y = ( canvas.height - img.height*ratio ) / 2;  
            ctx.clearRect(0,0,canvas.width, canvas.height);
            ctx.drawImage(img, 0,0, img.width, img.height,
                               centerShift_x,centerShift_y,img.width*ratio, img.height*ratio);  
         }
         
        function dcropTriggerCroppr() {
            window.dcropCroppr = new Croppr('#dcrop-modal-image', {
                aspectRatio: options.aspectRatio,
                maxSize: options.maxSize,
                minSize: options.minSize,
                startSize: options.startSize,
                onCropStart: options.onCropStart,
                onCropMove: options.onCropMove,
                onCropEnd: options.onCropEnd,
                onInitialize: options.onInitialize,
                onCropMove: options.onCropMove,
            });
        }
        
        function dcropTriggerModal(id, src) {
            // take in animation option and add 'animated' before it
            var animation = options.modalAnimation;
            if (animation) {
                if (animation.indexOf('animated') == -1) {
                    animation = 'animated ' + animation;
                }
            }
            var lightmodalHTML =
            '<div class="light-modal" id="dcrop-modal" role="dialog" aria-labelledby="light-modal-label" aria-hidden="false" data-lightmodal="close">'
                + '<div class="light-modal-content ' + animation + '">'
                    + '<!-- light modal header -->'
                    + '<!-- <div class="light-modal-header">'
                        + '<h3 class="light-modal-heading">dcrop</h3>'
                        + '<a href="#" class="light-modal-close-icon" aria-label="close">&times;</a>'
                    + '</div> -->'
                    + '<!-- light modal body -->'
                    + '<div class="light-modal-body" style="max-height: 500px;">'
                        + '<img id="dcrop-modal-image" src="' + src + '">'
                    + '</div>'
                    + '<!-- light modal footer -->'
                    + '<div class="light-modal-footer" style="justify-content: space-between;">'
                        + '<div onclick="closeModal()" class="light-btn light-modal-close-btn" style="cursor: pointer;" aria-label="close">Cancel</div>'
                        + '<div onclick="dcropRotateImage(`' + id + '`);" class="light-btn light-modal-close-btn" style="cursor: pointer;">Rotate 90deg</div>'
                        + '<div onclick="dcropCreateImage(`' + id + '`);" data-dest="'+_canvas+'" class="light-btn light-modal-close-btn" style="cursor: pointer;">Done</div>'
                    + '</div>'
                + '</div>'
                + '<canvas style="position: absolute; top: -99999px; left: -99999px;" id="dcrop-hidden-canvas"></canvas>'
                + '<a style="display:none;" id="dcrop-link"></a>'
            + '</div>';
            // modal element is appended to body
            $("body").append(lightmodalHTML);
            // after which the inserted image is drawn onto the hidden canvas within the modal
            setTimeout(function(){
                var canvas = document.getElementById('dcrop-hidden-canvas');
                var ctx = canvas.getContext('2d');
                ctx.canvas.width = dcropCanvasWidth;
                ctx.canvas.height = dcropCanvasHeight;
                var img = new Image();
                img.src = src;
                ctx.drawImage(img, 0, 0, dcropCanvasWidth, dcropCanvasHeight);
                setTimeout(function(){
                    // the css-only modal is called via href see https://hunzaboy.github.io/Light-Modal/#
                    window.location = window.location.pathname + "#dcrop-modal";
                    // function to trigger croppr.js on picture in modal
                    dcropTriggerCroppr();
                }, 50);
            }, 50);
        }

        function dcropTriggerSignatureModal(_canvas_id) {
            var animation = options.modalAnimation;
            if (animation) {
                if (animation.indexOf('animated') == -1) {
                    animation = 'animated ' + animation;
                }
            }
            var lightmodalHTML =
            '<div class="light-modal" id="dcrop-modal" role="dialog" aria-labelledby="light-modal-label" aria-hidden="false" data-lightmodal="close">'
                + '<div class="light-modal-content ' + animation + '">'
                    + '<!-- light modal header -->'
                    + '<!-- <div class="light-modal-header">'
                        + '<h3 class="light-modal-heading">dcrop</h3>'
                        + '<a href="#" class="light-modal-close-icon" aria-label="close">&times;</a>'
                    + '</div> -->'
                    + '<!-- light modal body -->'
                    + '<div class="light-modal-body" style="max-height: 500px;">'
                    +'<div id="signArea" >'
                    +'<h2 class="tag-ingo">Put signature below</h2>'
                    +'<div class="sig sigWrapper" style="height:auto;">'
                        +'<div class="typed"></div>'
                        +'<canvas class="sign-pad" id="sign-pad" width="'+options.sigWidth+'" height="'+options.sigHeight+'"></canvas>'
                    +'</div>'
                    +'</div>'
                    + '</div>'
                    + '<!-- light modal footer -->'
                    + '<div class="light-modal-footer" style="justify-content: space-between;">'
                        + '<div onclick="closeModal()" class="light-btn light-modal-close-btn" style="cursor: pointer;" aria-label="close">Cancel</div>'
                        + '<div class="light-btn signature_clear_canvas" style="cursor: pointer;">Clear</div>'
                        + '<div class="light-btn light-modal-close-btn signature_canvas_" data-dest="'+_canvas_id+'" style="cursor: pointer;">Done</div>'
                    + '</div>'
                + '</div>'
                + '<a style="display:none;" id="dcrop-link"></a>'
            + '</div>';
            
                
            $("body").append(lightmodalHTML);
            setTimeout(function(){                
                setTimeout(function(){
                    // the css-only modal is called via href see https://hunzaboy.github.io/Light-Modal/#
                    window.location = window.location.pathname + "#dcrop-modal";
                    $('#signArea').signaturePad({drawOnly:true, drawBezierCurves:true,lineWidth : 0, lineTop:90});
                }, 50);
            }, 50);
        }
        // function to capture input and insert it into various elements for previewing and display
        // function takes in input object and its id
        function dcropReadURL(input, id) {
            // console.log('dcropReadURL');
            
            if (input.files && input.files[0]) {
                var reader = new FileReader();
                // images are drawn on all created canvases from previewers
                reader.onload = function (e) {
                    window.dcropPreviewersLength = $('[data-dcrop="' + id + '"]').length;
                    window.dcropPreviewCanvas = [];
                    window.dcropPreviewCanvasContext = [];
                    if (dcropPreviewersLength) {
                        for (let i = 0; i < dcropPreviewersLength; i++) {
                            dcropPreviewCanvas[i] = $('[data-dcrop="' + id + '"]')[i];
                            dcropPreviewCanvasContext[i] = dcropPreviewCanvas[i].getContext('2d');
                            dcropPreviewCanvasContext[i].canvas.width = $(dcropPreviewCanvas[i]).width() || 300;
                            window.dcropCanvasWidth = $(dcropPreviewCanvas[i]).width() || 300;
                            dcropPreviewCanvasContext[i].canvas.height = $(dcropPreviewCanvas[i]).height() || 300;
                            window.dcropCanvasHeight = $(dcropPreviewCanvas[i]).height() || 300;
                            var img = new Image();
                            img.onload = function(){
                                dcropPreviewCanvasContext[i].drawImage(img, 0, 0, dcropCanvasWidth, dcropCanvasHeight);
                            };
                            img.src = e.target.result;
                        }
                    }
                    
                    dcropTriggerModal(id, e.target.result);
                    // console.log('modal oppend');
                }
                reader.readAsDataURL(input.files[0]);
            }
        }
        // function to close modal when user clicks outside modal
        $(document).click(function (e) {
            if ($(e.target).is('#dcrop-modal')) {
                closeModal();
            }
        });
        
        $('.signature').on('click',function(e){
            /**
             * open signature pad in modal
             */
            _canvas = $(this).closest('div').find('input').attr('id');
            dcropTriggerSignatureModal(_canvas);
        });
        
        $(document).on('click', '.signature_clear_canvas', function(e){
            $("#signArea").signaturePad().clearCanvas();
        });

        
            $(_self).on("change", function(){
                
                _canvas = $(this).closest('div').find('input').attr('id');
                // resetFileInput($(this).attr('id'));
                var dcropInputId = $(this).attr('id');
                
                var ext = $('#' + dcropInputId).val().split('.').pop().toLowerCase();
                
                if($.inArray(ext, options.allowedInputs) == -1) {
                    alert('invalid extension! Please check your input file and try again.');
                } else {
                    
                    dcropReadURL(this, dcropInputId);
                }
                resetFileInput(dcropInputId);
            });
        // });
        
    } //** End Of Plugin */
});
// function to close modal
function closeModal() {
    $('#dcrop-modal').remove();
    window.location = window.location.pathname + '#';
}