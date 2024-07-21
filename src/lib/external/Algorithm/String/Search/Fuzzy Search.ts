import { levenshtein_distance } from './Levenshtein Distance.js';

export interface IFuzzyMatchResult {
  distance: number;
  inputWord: string;
}

export interface IFuzzyMatchListResult {
  distance: number;
  inputIndex: number;
}

export interface IFuzzyMultiMatchListResult {
  count: number;
  distance: number;
  inputIndex: number;
}

export class FuzzyMatcher {
  protected mapInputToTargetToDistance: Map<string, Map<string, number>> = new Map();
  protected addDistance(input: string, target: string): void {
    if (this.mapInputToTargetToDistance.has(input)) {
      const mapTargetToDistance = this.mapInputToTargetToDistance.get(input)!;
      if (!mapTargetToDistance.has(target)) {
        mapTargetToDistance.set(target, levenshtein_distance(input, target));
      }
    } else {
      this.mapInputToTargetToDistance.set(input, new Map<string, number>([[target, levenshtein_distance(input, target)]]));
    }
  }
  protected getDistance(input: string, target: string): number {
    return this.mapInputToTargetToDistance.get(input)?.get(target) ?? -1;
  }

  public search(inputText: string, targetText: string): IFuzzyMatchResult[] {
    const inputWordSet = new Set<string>(inputText.split(' '));

    inputWordSet.forEach((inputWord) => this.addDistance(inputWord, targetText));

    const toFuzzyMatchResult = (inputWord: string): IFuzzyMatchResult => ({
      distance: this.getDistance(inputWord, targetText),
      inputWord,
    });

    return Array.from(inputWordSet)
      .map(toFuzzyMatchResult)
      .sort((a, b) => a.distance - b.distance);
  }

  public searchList(inputTextList: string[], targetText: string, tolerance = 0): IFuzzyMatchListResult[] {
    const inputTextSet = new Set<string>();
    const matchResultListList: IFuzzyMatchListResult[][] = [];

    for (const [inputIndex, inputText] of inputTextList.entries()) {
      if (!inputTextSet.has(inputText)) {
        inputTextSet.add(inputText);
        matchResultListList.push(
          this.search(inputText, targetText).map(({ distance }) => ({
            distance,
            inputIndex,
          })),
        );
      }
    }

    const minMatchDistance = matchResultListList.map(([matchResult]) => matchResult.distance).reduce((a, b) => (a < b ? a : b));

    const isWithinTolerance = ({ distance }: IFuzzyMatchListResult) => Math.abs(distance - minMatchDistance) <= tolerance;

    return matchResultListList.flatMap((matchResultList) => matchResultList.filter(isWithinTolerance)).sort((a, b) => a.distance - b.distance);
  }

  public searchMultiList(inputTextList: string[], targetText: string, tolerance = 0) {
    const targetWordSet = new Set<string>(targetText.split(' '));
    const indexToMatchResultMap = new Map<number, IFuzzyMultiMatchListResult>();

    function addToMatchResultMap({ inputIndex, distance }: IFuzzyMatchListResult) {
      if (indexToMatchResultMap.has(inputIndex)) {
        const matchResult = indexToMatchResultMap.get(inputIndex)!;
        matchResult.count += 1;
        matchResult.distance += distance;
      } else {
        indexToMatchResultMap.set(inputIndex, {
          count: 1,
          distance,
          inputIndex,
        });
      }
    }

    Array.from(targetWordSet)
      .flatMap((targetWord) => this.searchList(inputTextList, targetWord, tolerance))
      .forEach(addToMatchResultMap);

    return Array.from(indexToMatchResultMap.values()).sort((a, b) => b.count / b.distance - a.count / a.distance || b.count - a.count || a.inputIndex - b.inputIndex);
  }
}

export interface ITextProcessor {
  (text: string): string;
}

export class TextProcessor {
  static ProcessText(text: string, processors: ITextProcessor[]): string {
    return processors.reduce((processedText, processor) => processor(processedText), text);
  }
  static ProcessTextList(textList: string[], processors: ITextProcessor[]): string[] {
    return textList.map((text) => processors.reduce((processedText, processor) => processor(processedText), text));
  }
  constructor(public processors: ITextProcessor[]) {}
  public run<T>(input: T): T {
    if (Array.isArray(input) && typeof input[0] === 'string') {
      return TextProcessor.ProcessTextList(input as string[], this.processors) as T;
    }
    if (typeof input === 'string') {
      return TextProcessor.ProcessText(input as string, this.processors) as T;
    }
    return input;
  }
}
