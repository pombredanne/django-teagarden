goog.provide('teagarden');
goog.provide('teagarden.comments');
goog.provide('teagarden.shortcuts');
goog.provide('teagarden.timeline');

goog.require('goog.dom');
goog.require('goog.events');
goog.require('goog.net.XhrIo');
goog.require('goog.ui.KeyboardShortcutHandler');
goog.require('goog.ui.Tooltip');

/**
  * Display a tooltip
  * @param {Object} obj Object
  * @param {String} url_part
  * @param {String} url_mapper
  */
teagarden.show_popup = function(obj, url_part, url_mapper) {
  var url = obj.getAttribute("href");
  var index = url.indexOf(url_part);
  var key = url.substring(index + url_part.length + 1);
  var xhr = new goog.net.XhrIo();
  goog.net.XhrIo.send('/' + base_url + url_mapper + key, function(e) {
    var xhr = e.target;
    var response = xhr.getResponseText();
    var tooltip = new goog.ui.Tooltip(obj);
    tooltip.setHtml(response);
    tooltip.setShowDelayMs(300);
  });
}

// Starred items

/**
  * Add or remove an object star.
  * @param {Integer} id Id of the booking entry
  * @param {String} url
  * @param {String} name
  */
teagarden.set_object_star = function(id, url, name) {
  var xhr = new goog.net.XhrIo();
  goog.net.XhrIo.send('/' + base_url + id + url, function(e) {
    var xhr = e.target;
    var response = xhr.getResponseText();
    var el = goog.dom.getElement(name + '-star-' + id);
    el.innerHTML = response;
  });
}

/**
 * Star a field item.
 * @param id
 */
teagarden.add_field_star = function(id) {
  teagarden.set_object_star(id, '/star_field', 'field');
}

/**
 * Unstar a field.
 * @param id
 */
teagarden.remove_field_star = function(id) {
  teagarden.set_object_star(id, '/unstar_field', 'field');
}

/**
 * Star a table item.
 * @param id
 */
teagarden.add_table_star = function(id) {
  teagarden.set_object_star(id, '/star_table', 'table');
}

/**
 * Unstar a table.
 * @param id
 */
teagarden.remove_table_star = function(id) {
  teagarden.set_object_star(id, '/unstar_table', 'table');
}

// Shortcuts

teagarden.shortcuts.show_help = function() {
  var help = goog.dom.getElement("help");
  if (help_displayed) {
    help.style.display = "none";
    help_displayed = false;
  }
  else {
    help.style.display = "";
    help_displayed = true;
  }
}

teagarden.shortcuts.handle = function(event) {
  switch (event.identifier) {
    case "SHIFT_H":
      teagarden.shortcuts.show_help();
      break;
    case "GD":
      document.location.href = dashboard_link;
      break;
    case "M":
      document.location.href = publish_link;
    }
}

teagarden.shortcuts.init_handler = function() {
  var shortcutHandler = new goog.ui.KeyboardShortcutHandler(document);
  var CTRL = goog.ui.KeyboardShortcutHandler.Modifiers.CTRL;
  var SHIFT = goog.ui.KeyboardShortcutHandler.Modifiers.SHIFT;
  var NONE = goog.ui.KeyboardShortcutHandler.Modifiers.NONE;
  shortcutHandler.registerShortcut('SHIFT_H',
    goog.events.KeyCodes.H, SHIFT);
  shortcutHandler.registerShortcut('GD', goog.events.KeyCodes.G, NONE,
    goog.events.KeyCodes.D);
  shortcutHandler.registerShortcut('M', goog.events.KeyCodes.M);
  goog.events.listen(
    shortcutHandler,
    goog.ui.KeyboardShortcutHandler.EventType.SHORTCUT_TRIGGERED,
    teagarden.shortcuts.handle);
}

// Comment expand/collapse

teagarden.switch_comment_common_ = function(prefix, suffix) {
  prefix && (prefix +=  '-');
  suffix && (suffix =  '-' + suffix);
  var previewSpan = goog.dom.getElement(prefix + 'preview' + suffix);
  var commentDiv = goog.dom.getElement(prefix + 'comment' + suffix);
  if (!previewSpan || !commentDiv) {
    alert('Failed to find comment element: ' +
          prefix + 'comment' + suffix + '. Please send ' +
          'this message with the URL to the app owner');
    return;
  }
  if (previewSpan.style.visibility == 'hidden') {
    previewSpan.style.visibility = 'visible';
    commentDiv.style.display = 'none';
  } else {
    previewSpan.style.visibility = 'hidden';
    commentDiv.style.display = '';
  }
}

teagarden.switch_changelist_comment = function(cid) {
  teagarden.switch_comment_common_('cl', String(cid));
}

/**
  * Toggle a section
  * @param {String} id The div id
  */
teagarden.toggle_section = function(id) {
  var pointer = goog.dom.getElement(id + "-pointer");
  var sectionStyle = goog.dom.getElement(id).style;
  var image = goog.dom.getElement(id + "-image");
  if (sectionStyle.display == "none") {
    if (image != null) {
      image.className = "sprite minus";
    }
    sectionStyle.display = "";
  } else {
    if (image != null) {
      image.className = "sprite plus";
    }
    sectionStyle.display = "none";
  }
}

teagarden.hide_all_comments = function(prefix, num_comments) {
  for (var i = 0; i < num_comments; i++) {
    goog.dom.getElement(prefix + "-preview-" + i).style.visibility = "visible";
    goog.dom.getElement(prefix + "-comment-" + i).style.display = "none";
  }
}

teagarden.show_all_comments = function(prefix, num_comments) {
  for (var i = 0; i < num_comments; i++) {
    goog.dom.getElement(prefix + "-preview-" + i).style.visibility = "hidden";
    goog.dom.getElement(prefix + "-comment-" + i).style.display = "";
  }
}

function M_setValueFromDivs(divs, text) {
  var lines = [];
  var divsLength = divs.length;
  for (var i = 0; i < divsLength; i++) {
    lines = lines.concat(divs[i].innerHTML.split("\n"));
    // It's _fairly_ certain that the last line in the div will be
    // empty, based on how the template works. If the last line in the
    // array is empty, then ignore it.
    if (lines.length > 0 && lines[lines.length - 1] == "") {
      lines.length = lines.length - 1;
    }
  }
  for (var i = 0; i < lines.length; i++) {
    // Undo the <a> tags added by urlize and urlizetrunc
    lines[i] = lines[i].replace(/<a (.*?)href=[\'\"]([^\'\"]+?)[\'\"](.*?)>(.*?)<\/a>/ig, '$2');
    // Undo the escape Django filter
    lines[i] = lines[i].replace(/&gt;/ig, ">");
    lines[i] = lines[i].replace(/&lt;/ig, "<");
    lines[i] = lines[i].replace(/&quot;/ig, "\"");
    lines[i] = lines[i].replace(/&#39;/ig, "'");
    lines[i] = lines[i].replace(/&amp;/ig, "&"); // Must be last
    text.value += "> " + lines[i] + "\n";
  }
}

teagarden.comments.reply = function(message_id, creation_date, username) {
  var form = goog.dom.getElement('comment-reply-form');
  form = form.cloneNode(true);
  if (typeof form.message == 'undefined') {
    var form_template = goog.dom.getElement('comment-reply-form');
    form = goog.dom.createElement('form');
    form.setAttribute('method', 'POST');
    form.setAttribute('action', form_template.getAttribute('action'));
    form.innerHTML = form_template.innerHTML;
  }
  var container = goog.dom.getElement('comment-reply-' + message_id);
  container.appendChild(form);
  container.style.display = '';
  form.discard.onclick = function () {
    //goog.dom.getElement('message-reply-href-' + message_id).style.display = '';
    //goog.dom.getElement('comment-actions-' + message_id).style.display = '';
    goog.dom.getElement('comment-reply-' + message_id).innerHTML = '';
  }
  form.message.value = creation_date + ', ' + username + ' ' + gettext('wrote') + ':\n';
  // TODO: Currently we can fetch the divs only by it's class name.
  var divs = goog.dom.getElementsByClass('cl-comment-' + message_id);
  M_setValueFromDivs(divs, form.message);
  form.message.value += "\n";
  form.message.focus();
  //goog.dom.getElement('message-reply-href-' + message_id).style.display = 'none';
  //goog.dom.getElement('comment-actions-' + message_id).style.display = 'none';
}

/**
 * Expand a single timeline entry.
 * @param {String} id The element id
 */
teagarden.timeline.expand = function(id) {
  var desc = goog.dom.getElement(id + "-short-description");
  teagarden.toggle_section(id);
    if (desc.style.display == "none") {
      desc.style.display = "";
    }
    else {
      desc.style.display = "none";
    }
}

/**
  * Expand all timeline entries within a table
  * @param {String} id The table id
  */
teagarden.timeline.expand_all = function(id) {
  var table = goog.dom.getElement(id);
  var divs = table.getElementsByTagName('div');
  for (i = 0; i < divs.length; i++) {
    var e = divs[i];
    if (e.className == 'details') {
      e.style.display = '';
    }
  }
  var spans = table.getElementsByTagName('span');
  for (i = 0; i < spans.length; i++) {
    var e = spans[i];
    if (e.className == 'sprite plus') {
      e.className = 'sprite minus';
    }
    else if (e.id.match(/^.*short-description$/)) {
      e.style.display = 'none';
    }
  }
};

/**
  * Collapse all timeline entries within a table
  * @param {String} id The table id
  */
teagarden.timeline.collapse_all = function(id) {
  var table = goog.dom.getElement(id);
  var divs = table.getElementsByTagName('div');
  for (i = 0; i < divs.length; i++) {
    var e = divs[i];
    if (e.className == 'details') {
      e.style.display = 'none';
    }
  }
  var spans = table.getElementsByTagName('span');
  for (i = 0; i < spans.length; i++) {
    var e = spans[i];
    if (e.className == 'sprite minus') {
      e.className = 'sprite plus';
    }
    else if (e.id.match(/^.*short-description$/)) {
      e.style.display = '';
    }
  }
};
