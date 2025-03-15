/*:
 * @target MZ
 * @plugindesc Adds Import Save & Export Save buttons to the title menu.
 * @author Caethyril
 * @url https://forums.rpgmakerweb.com/threads/174088/
 * @help Free to use and/or modify for any project, no credit required.
 */
;void (() => {
"use strict";

  /** "Import Save" command display name. */
  const COM_IN = "Import Save";
  /** "Export Save" command display name. */
  const COM_EX = "Export Save";

  /** @returns {number} Height (px) to add to title command window. */
  const addHeight = function() {
    return 2 * Window_TitleCommand.prototype.itemHeight();
  };

  // Response functions, all bound to parent `Scene_Title` instance.
  const postAction    = function()   { this._commandWindow.activate(); };
  const importSuccess = function(id) { alert(`Save ${id} imported successfully!`); };
  const importFailure = function()   { alert("Import save failed."); };
  const exportSuccess = function()   { alert("Save data copied to clipboard!"); };
  const exportFailure = function()   { alert("Save export failed."); };

  /** Prompts user to paste save data, then imports it. */
  const importSave = function(
    id = DataManager.emptySavefileId(),
    json = prompt("WARNING! Will crash game if you type in random stuff. Don't do that.\nPaste save data here:")
  ) {
    if (id < 0) {
      alert(`Cannot import to save slot ${id}.`);
      postAction.call(this);
    } else if (!json) {
      postAction.call(this);
    } else {
      console.log("importSave:", json);
      const key = DataManager.makeSavename(id);
      StorageManager.jsonToZip(json)
                    .then(zip => StorageManager.saveZip(key, zip))
                    .then(() => DataManager.loadGame(id))
                    .then(() => DataManager.saveGame(id))
                    .then(importSuccess.bind(this, id))
                    .catch(importFailure.bind(this))
                    .finally(postAction.bind(this));
    }
  };

  /** Exports save data from specified slot. */
  const exportSave = function(id = prompt("(0 = Autosave)\nNOTE: Playtime is not saved.\nEnter save file number to export:")) {
    if (DataManager.savefileExists(id = parseInt(id, 10))) {
      const key = DataManager.makeSavename(id);
      StorageManager.loadZip(key)
                    .then(zip => StorageManager.zipToJson(zip))
                    .then(json => navigator.clipboard.writeText(json))
                    .then(exportSuccess.bind(this))
                    .catch(exportFailure.bind(this))
                    .finally(postAction.bind(this));
    } else {
      alert(`Save file ${id} not found. Export failed!`);
      postAction.call(this);
    }
  };

  // Patch - add new commands to title menu.
  void (alias => {
    Window_TitleCommand.prototype.makeCommandList = function() {
      alias.apply(this, arguments);
      this.addCommand(COM_IN, "saveImport");
      this.addCommand(COM_EX, "saveExport", DataManager.isAnySavefileExists());
    };
  })(Window_TitleCommand.prototype.makeCommandList);

  // Patch - bind handlers to new title commands.
  void (alias => {
    Scene_Title.prototype.createCommandWindow = function() {
      alias.apply(this, arguments);
      const w = this._commandWindow;
      w.setHandler("saveImport", importSave.bind(this));
      w.setHandler("saveExport", exportSave.bind(this));
    };
  })(Scene_Title.prototype.createCommandWindow);

  // Patch - increase title window height to accommodate new commands.
  void (alias => {
    Scene_Title.prototype.commandWindowRect = function() {
      const r = alias.apply(this, arguments);
      r.height += addHeight();
      return r;
    };
  })(Scene_Title.prototype.commandWindowRect);

})();