/**
 * Select only the CURRENT release from the bounded, rolling RELEASE_NOTES.md.
 * The historical changelog is authoritative evidence and must never be
 * replaced or prefixed with earlier rolling release headings.
 * This helper does NOT create GitHub releases, tags, builds or approvals.
 */
const heading=/^# MID v(\d+\.\d+\.\d+(?:\.\d+)?)[ \t]*$/gm;
// Historical headings use Markdown levels 1–4 (sometimes with titles); guard
// against a duplicate version at *any* level before modifying history.
const historicHeading=/^#{1,6}[ \t]+(?:MID[ \t]+)?v(\d+\.\d+\.\d+(?:\.\d+)?)(?=$|[ \t:—–·-])[^\r\n]*$/gm;
const validVersion=/^\d+\.\d+\.\d+(?:\.\d+)?$/;

export function currentMidReleaseSection(releaseNotes,version){
 if(!validVersion.test(version)||typeof releaseNotes!=='string')
  throw Error('MID changelog: version/notes invalid');
 const source=releaseNotes.trimStart();
 const matches=[...source.matchAll(heading)];
 if(!matches.length||matches[0].index!==0||matches[0][1]!==version)
  throw Error('MID changelog: first release heading must match exact package version');
 const section=source.slice(0,matches[1]?.index??source.length).trimEnd();
 if(!/^[-*][ \t]+\S/m.test(section))
  throw Error('MID changelog: current release notes are empty');
 return section;
}

export function prependMidCurrentRelease(changelog,releaseNotes,version){
 if(typeof changelog!=='string')throw Error('MID changelog: prior history missing');
 const current=currentMidReleaseSection(releaseNotes,version);
 const headings=[...changelog.matchAll(historicHeading)];
 const matching=headings.filter(match=>match[1]===version);
 if(matching.length){
  // Existing current heading can have a different level/title. Never rewrite
  // any of its existing bytes during a repeat version synchronization.
  if(matching.length===1&&headings[0]===matching[0]&&!changelog.slice(0,matching[0].index).trim())return changelog;
  throw Error('MID changelog: current version already exists away from first position; reconcile without duplication');
 }
 if(!changelog.trim())
  throw Error('MID changelog: historic source is empty; do not overwrite it');
 return current+'\n\n'+changelog; // Never trim or rewrite original historical bytes.
}
