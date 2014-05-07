// Copyright (c) 2013 The Chromium OS Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

'use strict';

// Chrome-specific wash executables.

wash.executables.chrome = {};

wash.executables.chrome.install = function(jsfs, path, onSuccess, onError) {
  var exes = {};
  for (var key in wash.executables.chrome.callbacks) {
    var callback = wash.executables.chrome.callbacks[key];
    exes[key] = new wam.jsfs.Executable(callback.bind(null, jsfs));
  }

  jsfs.makeEntries(path, exes, onSuccess, onError);
};

wash.executables.chrome.callbacks = {};

wash.executables.chrome.callbacks['mount.chrome'] = function(
    jsfs, executeContext) {
  executeContext.ready();
  var arg = executeContext.arg || {};

  if (!arg instanceof Object) {
    executeContext.closeError('wam.FileSystem.Error.UnexpectedArgvType',
                              ['object']);
    return;
  }

  var id = arg.id;
  if (!id || typeof id != 'string') {
    executeContext.closeError('wam.FileSystem.Error.MissingOrBadArgument',
                              ['id', 'string']);
    return;
  }

  var path = arg.path;
  if (!path)
    path = '/mnt/' + id;

  if (typeof path != 'string') {
    executeContext.closeError('wam.FileSystem.Error.MissingOrBadArgument',
                              ['id', 'string']);
    return;
  }

  wam.transport.ChromePort.connect(id, function(transport) {
      if (!executeContext.isOpen) {
        if (transport)
          transport.disconnect();
        return;
      }

      if (!transport) {
        executeContext.closeError('wam.FileSystem.Error.RuntimeError',
                                  ['Transport connection failed.']);
        return;
      }

      var channel = new wam.Channel(transport, 'chrome-extension:' + id);
      //channel.verbose = wam.Channel.verbosity.ALL;

      jsfs.makeEntry(path, new wam.jsfs.RemoteFileSystem(channel),
                     function() {
                       executeContext.closeOk(null);
                     },
                     function(value) {
                       transport.disconnect();
                       executeContext.closeErrorValue(value);
                     });
    });
};

wash.executables.chrome.callbacks['nacl'] = function(jsfs, executeContext) {
  lib.wash.NaCl.main(executeContext);
};

wash.executables.chrome.callbacks['pnacl'] = function(jsfs, executeContext) {
  lib.wash.NaCl.main(executeContext);
};
