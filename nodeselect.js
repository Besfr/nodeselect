var Nodeselect = Nodeselect || {};
var AEFNodeselect = AEFNodeselect || {};
var hasDroppable = 0;



/**
 * Launch all the necessary functions for loading time.
 */
$(document).ready(function() {

});

/**
 * Launch all the necessary functions for the nodeselect fields
 * (CCK nodereference fields that were selected on the admin panel)
 * at launch and when the "Add another item" button is clicked.
 */
 
Drupal.behaviors.nodeselect_behavior = function() {
  // Handle the Droppable areas
  $('.nsdrop:not(.nsdrop-processed)').addClass('nsdrop-processed').each(function(){
    $(this).droppable({
     	accept: function (droppableElement) {
        return Nodeselect.isElementDroppable(droppableElement);
      },
      //accept: '.nsdrag-processed',
     	activeClass: 'nsdrop-active',
     	hoverClass:	'nsdrop-hover',
      tolerance: 'touch',
     	drop:	function(event, ui) {
        Nodeselect.ondropActionExemple(event, ui, $(this));
      }
    });
    hasDroppable = 1; 
  });

  if (hasDroppable) {
    // Add the draggable behavior to results
    $('.nsdrag:not(.nsdrag-processed)').addClass('nsdrag-processed').each(function () {
      $(this).draggable({
        //fx: 	    30,
        //ghosting:	false,
        containment: 'document',
        cursor: 'pointer',
        revert: true,
        // scroll: true, // need to autoscroll
        snap: true,
        zIndex: 	1000,
        start: function () {
          //Check if we are fixed
          var element = $(this);
          element.attr('element-fixed', 'false');
          $(this).parents().each(function() {
            if($(this).css('position') == 'fixed')
              element.attr('element-fixed', 'true');
          });
        },
        drag: function (x,y) {
          //If this element is inside a fixed element, we need to adjust the position of the dragged element.
          if($(this).attr('element-fixed') == "true")
            return {x: x + $(window).scrollLeft(), y: y + $(window).scrollTop()};
          else
            return {x: x, y: y};
        }
      });
    });
  }


  //
  // Handle the view/edit links
  //
  //AEFNodeselect.HandlePreviewAreaLinks();
  
}

Nodeselect.isElementDroppable = function(droppableElement) {
  return droppableElement.hasClass('nsdrag-processed');
}

Nodeselect.ondropActionExemple = function(event, ui, droppable) {
  droppable.attr('value', ui.draggable.html());
}

AEFNodeselect.AddEditCommands = function(item, itemvalue) {

  //If there was already the edit links, remove them. The links will be updated.
  var Xonce = item.parent('div.form-item').html().match(/\[X\]/);
  if(Xonce != null)
  {
    item.parent('div.form-item').children('.field-suffix').remove();
    item.parent('div.form-item').children('.nodeselect-delete-link').remove();
  }

	if (itemvalue) 
  {
    //Add the [X] delete link
    item.parent('div.form-item').prepend('<a href="#" title="'+ item.attr('id') +'" class="nodeselect-delete-link">[X]</a>');
    item.parent('div.form-item').children('.nodeselect-delete-link').click(function() {
      return AEFNodeselect.HandleNodeSelectDelete(this);
    });

    //Add the View/Edit links
    var nid = itemvalue.match(/\[nid:(\d+)\]/);
    if(nid != null)
    {
      item.parent('div.form-item').append('<span class="field-suffix">');
      if(aef_nodeselect_display_edit_link!=0){
        item.parent('div.form-item').children('.field-suffix').append('<a href="' + Drupal.settings.basePath + 'node/' + nid[1] + '/edit/aef_embedded_edit" class="nodeselect-node">' + Drupal.t('edit') + '</a> | ');
      }
      if(aef_nodeselect_display_view_link!=0){
        item.parent('div.form-item').children('.field-suffix').append('<a href="' + Drupal.settings.basePath + 'node/' + nid[1] + '/aef_embedded_edit" class="nodeselect-node">' + Drupal.t('view') + '</a></span>');
      }
    }
    AEFNodeselect.HandlePreviewAreaLinks();

  }

}


/**
 * Handle all .nodeselect-node nodes to make them open their links in the preview area
 */
AEFNodeselect.HandlePreviewAreaLinks = function() {
  $('.nodeselect-node:not(.nodeselect-node-processed)').addClass('nodeselect-node-processed').click(function() {
    var url = $(this).attr('href');
    aef_embedded_edit_show(url, null);
    return false;
  });
}


/**
 * Handle what's happening when the [X] link close to the node field is clicked.
 */
AEFNodeselect.HandleNodeSelectDelete = function(link) {

  //Try to remove Multimedia elements references from the editor window(s).
  if(typeof FCKeditorAPI != 'undefined')
  {
    //Weird, does not return all instances ...
    //alert($(FCKeditorAPI.Instances).size());
    $(FCKeditorAPI.Instances).each(function() { 
      var instance = $(this);
      var editor = instance.EditorDocument;
      //link.title contains the id of the input
      var input = $('#' + link.title);
      if(input.size() > 0)
      {
        var inputDomTag = input.get(0);
        var matches = inputDomTag.value.match(/\[nid:(\d+)\]/);
        if(matches != null)
        {
          $(editor).find("img[eltmmnumber='" + matches[1] + "']").remove();
        }
      }
    });
  }

  $('#'+ link.title).val('');
  //Trigger the change even
  $('#'+ link.title).trigger('change');

  $(link).parent('div.form-item').children('.field-suffix').remove();
  $(link).parent('div.form-item').children('.nodeselect-delete-link').remove();

  return false;
}

/**
 * Function which emulate outerHTML.
 * Found in http://blog.brandonaaron.net/2007/06/17/jquery-snippets-outerhtml/
 *
 */
	jQuery.fn.outerHTML = function() {
		return $('<div>').append(this.eq(0).clone()).html();
	};

/**
 * Return the HTML of the clicked field. The parameter must be a JQuery object.
 *
 * This function correct the following JS bug: if the user put a value in
 * a field and then we fetch the whole HTML of this field (<input type="text" value="" />),
 * the 'value' attribute of the field is empty.
 * This function put the value in the HTML.
 *
 */
function getFieldObjectHTML($field, val) {
  // Fetch the HTML of the field
  var html = $field.outerHTML();
  // Put the value of the field if it contains a value attribute
  if (html.indexOf('value="') != -1) {
    // Replace quotation marks by its HTML entities
    val = val.replace(/\"/g, '\&#34;');
    html = html.replace(/value=".*?"/, 'value="'+ val +'"');
  }
  return html;
}

