-- =====================================================================
-- 10 EXEMPELFRÅGOR – BARA FÖR ATT TESTA FLÖDET
--
-- ⚠️ De här frågorna är skrivna för att testa systemet. De är INTE
-- kontrollerade mot Sverige i fokus, och kapitelnumren är gissningar.
-- De sparas som utkast (draft) och märks med is_sample = true.
-- Byt ut dem mot frågor som du själv har granskat mot studiematerialet.
--
-- Ta bort alla exempelfrågor:  delete from public.questions where is_sample;
-- =====================================================================

insert into public.questions
  (country, chapter, section, question, options, correct_index, explanation, source_reference, difficulty, status, is_sample, review_note)
values
('se', 1, '', 'Hur många ledamöter har Sveriges riksdag?',
  array['101', '249', '349', '449'], 2,
  'Riksdagen har 349 ledamöter. De väljs av folket i allmänna val och representerar hela landet.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 1, 'draft', true, 'Exempelfråga. Kontrollera mot källan.'),

('se', 1, '', 'Hur ofta hålls val till riksdagen?',
  array['Vart tredje år', 'Vart fjärde år', 'Vart femte år', 'Vart sjätte år'], 1,
  'Val till riksdagen hålls vart fjärde år. Samma dag väljer man också vilka som ska styra i kommunen och regionen.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 1, 'draft', true, 'Exempelfråga. Kontrollera mot källan.'),

('se', 2, '', 'Vilken roll har kungen i Sverige?',
  array['Kungen leder regeringen', 'Kungen är statschef men har ingen politisk makt', 'Kungen beslutar om nya lagar', 'Kungen utser domarna i domstolarna'], 1,
  'Kungen är Sveriges statschef och representerar landet, till exempel vid statsbesök. Men kungen fattar inga politiska beslut. Den politiska makten har riksdagen och regeringen.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 2, 'draft', true, 'Exempelfråga. Kontrollera mot källan.'),

('se', 2, '', 'Vilken av dessa är en av Sveriges grundlagar?',
  array['Skollagen', 'Brottsbalken', 'Tryckfrihetsförordningen', 'Socialtjänstlagen'], 2,
  'Sverige har fyra grundlagar: regeringsformen, tryckfrihetsförordningen, yttrandefrihetsgrundlagen och successionsordningen. Grundlagar är svårare att ändra än vanliga lagar.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 2, 'draft', true, 'Exempelfråga. Kontrollera mot källan.'),

('se', 3, '', 'Hur stor andel av rösterna i hela landet måste ett parti få för att komma in i riksdagen?',
  array['Minst 1 procent', 'Minst 4 procent', 'Minst 10 procent', 'Minst 12 procent'], 1,
  'Ett parti behöver minst 4 procent av rösterna i hela landet för att få platser i riksdagen. Gränsen kallas spärr och gör att det inte blir för många små partier.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 2, 'draft', true, 'Exempelfråga. Det finns även en regel om 12 procent i en valkrets – kontrollera hur källan beskriver det.'),

('se', 4, '', 'Vem har huvudansvaret för hälso- och sjukvården i Sverige?',
  array['Kommunerna', 'Regionerna', 'Riksdagen', 'Arbetsförmedlingen'], 1,
  'Regionerna ansvarar för hälso- och sjukvården, till exempel vårdcentraler och sjukhus. Kommunerna ansvarar bland annat för skola och äldreomsorg.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 2, 'draft', true, 'Exempelfråga. Kontrollera mot källan.'),

('se', 5, '', 'Vad innebär allemansrätten?',
  array['Att alla får bygga ett hus i skogen', 'Att alla får röra sig i naturen, även på någon annans mark, om man visar hänsyn', 'Att alla får jaga och fiska överallt utan tillstånd', 'Att all mark i Sverige ägs av staten'], 1,
  'Allemansrätten betyder att alla får vistas i naturen, även på mark som någon annan äger. Man måste visa hänsyn: inte störa, inte förstöra och inte gå för nära någons hus.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 1, 'draft', true, 'Exempelfråga. Kontrollera mot källan.'),

('se', 6, '', 'Vem får rösta i valet till riksdagen?',
  array['Alla som bor i Sverige och har fyllt 18 år', 'Svenska medborgare som har fyllt 18 år', 'Svenska medborgare som har fyllt 16 år', 'Alla som betalar skatt i Sverige'], 1,
  'För att rösta i riksdagsvalet måste man vara svensk medborgare och ha fyllt 18 år senast på valdagen. I val till kommun och region kan även vissa personer som inte är medborgare rösta.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 2, 'draft', true, 'Exempelfråga. Det finns även krav på folkbokföring – kontrollera hur källan beskriver det.'),

('se', 7, '', 'Vad betyder offentlighetsprincipen?',
  array['Att alla möten i riksdagen sänds på tv', 'Att allmänheten har rätt att läsa allmänna handlingar hos myndigheter', 'Att alla måste visa sin deklaration för grannarna', 'Att alla myndigheter måste ha öppet på helger'], 1,
  'Offentlighetsprincipen ger alla rätt att ta del av allmänna handlingar hos myndigheter. Det gör att medborgare och journalister kan granska hur makten används. Vissa uppgifter kan vara hemliga.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 3, 'draft', true, 'Exempelfråga. Kontrollera mot källan.'),

('se', 8, '', 'Vilket år blev Sverige medlem i Europeiska unionen (EU)?',
  array['1973', '1986', '1995', '2004'], 2,
  'Sverige blev medlem i EU år 1995, efter en folkomröstning år 1994. Det betyder att vissa beslut som påverkar Sverige fattas tillsammans med andra EU-länder.',
  'EXEMPEL – kontrollera kapitel och avsnitt i Sverige i fokus', 1, 'draft', true, 'Exempelfråga. Kontrollera mot källan.');
