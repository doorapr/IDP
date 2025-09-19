const replacers = [{ from: 'ä', to: 'ae' }, { from: 'ü', to: 'ue' }, { from: 'ö', to: 'oe' }, { from: 'ß', to: 'ss' }];

/**
 * Returns true if any of target_words can be constructed from understood_word by lowercasing and replacing umlauts according to the replacement rules replacers.
 * 
 * @param target_words Words to match against
 * @param understood_word Word to match
 * @returns true if the words match, false otherwise
 */
function words_match(target_words: Array<string>, understood_word: string): boolean {
  if (understood_word === undefined || understood_word === null) {
    return false;
  }

  const alternatives = new Set<string>();
  alternatives.add(understood_word.toLowerCase());

  for (const { from, to } of replacers) {
    for (const alt of [...alternatives].map(it => it.replaceAll(from, to))) {
      alternatives.add(alt);
    }
  }

  return target_words.some(it => alternatives.has(it.trim()));
}