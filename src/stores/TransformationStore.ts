import { Store, StoreItem } from "./Store";
import * as vscode from "vscode";

export interface SavedTransformation extends StoreItem {
  pattern: string;
  replacement: string;
  position: number;
  enabled: boolean;
}

export class TransformationStore implements Store<SavedTransformation> {
  private _onChange = new vscode.EventEmitter<void>();
  readonly onChange: vscode.Event<void> = this._onChange.event;

  constructor(private storeKey: string, private store: vscode.Memento) {}

  getAllItems() {
    let savedItems = this.store.get<SavedTransformation[]>(this.storeKey);
    if (!savedItems) {
      savedItems = [];
    }
    return Promise.resolve(savedItems);
  }

  async addItem(newTransformation: SavedTransformation) {
    let savedItems = this.store.get<SavedTransformation[]>(this.storeKey);
    if (!savedItems) {
      savedItems = [];
    }

    const existingIndex = savedItems.findIndex(function (
      currentTransformation
    ) {
      return currentTransformation.id === newTransformation.id;
    });

    if (existingIndex === -1) {
      savedItems.push({
        id: newTransformation.id,
        pattern: newTransformation.pattern,
        replacement: newTransformation.replacement,
        position: newTransformation.position || 0,
        enabled: newTransformation.enabled,
      });
    } else {
      savedItems.splice(existingIndex, 1, {
        id: newTransformation.id,
        pattern: newTransformation.pattern,
        replacement: newTransformation.replacement,
        position: newTransformation.position || 0,
        enabled: newTransformation.enabled,
      });
    }

    await this.store.update(this.storeKey, savedItems);

    this._onChange.fire();
    return true;
  }

  async removeItem(transformationId: string) {
    let savedItems = this.store.get<SavedTransformation[]>(this.storeKey);
    if (!savedItems) {
      return false;
    }

    savedItems = savedItems.filter(
      (transformation) => transformation.id !== transformationId
    );
    await this.store.update("savedTransformations", savedItems);

    this._onChange.fire();
    return true;
  }
}
