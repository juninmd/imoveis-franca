import boscoimoveis from "./boscoimoveis";
import oasisimobiliaria from "./oasisimobiliaria";
import gpsnegociosimobiliarios from './gpsnegociosimobiliarios';
import c15imob from './c15imob';
import aacosta from './aacosta';
import agnelloimoveis from './agnelloimoveis';
import imoveisfranca from './imoveis-franca';
import espaconobreimoveis from './espaconobreimoveis';
import { Site } from '../types';
import imobiliariapimentafranca from './imobiliariapimentafranca';
import imoveismpb from './imoveismpb';
import mazzaimoveis from './mazzaimoveis';
import parraimobiliaria from './parraimobiliaria';
import vtiimoveis from './vtiimoveis';
import sueliandradelopes from './sueliandradelopes';
import botelhoimobiliaria from './botelhoimobiliaria';
import unioconimobiliaria from './unioconimobiliaria';
import imobiliariaplano from './imobiliariaplano';
import transacaoimobiliaria from './transacaoimobiliaria';
import conectaassesconimoveis from './conectaassesconimoveis';
import r2imob from './r2imob';
import artefattoimoveis from './artefattoimoveis';
import anzimoveis from './anzimoveis';
import zagoimoveis from './zagoimoveis';
import bragaimobiliaria from './bragaimobiliaria';
import groupagility from './groupagility';
import silveiraimoveis from './silveiraimoveis';
import futuraimobiliariafranca from './futuraimobiliariafranca';
import casanovaimoveis from './casanovaimoveis';
import unicafrancaimoveis from "./unicafrancaimoveis";
import imperadorimoveis from "./imperadorimoveis";
import nielsenimoveis from "./nielsenimoveis";
import imobiliarialadonni from "./imobiliarialadonni";
import pucciimobiliaria from "./pucciimobiliaria";
import matriz from "./matriz";
import imobiliarialemos from "./imobiliarialemos";
import cintraimoveis from "./cintraimoveis";
import tratoimoveis from "./tratoimoveis";
import faleirosimoveis from "./faleirosimoveis";
import moradiaimoveis from "./moradiaimoveis";
import andresaborgesimoveis from "./andresaborgesimoveis";
import iegimoveisfrancaeregiao from "./iegimoveisfrancaeregiao";
import salimimobiliaria from "./salimimobiliaria";
import famaimoveisfranca from "./famaimoveisfranca";
import carlosimoveisfranca from "./carlosimoveisfranca";
import dinizmartins from "./dinizmartins";
import grupohabitat from "./grupohabitat";
import altagalleria from "./altagalleria";
import locallizegoldimob from "./locallizegoldimob";
import habitesefranca from "./habitesefranca";
import mercadoimoveisfranca from "./mercadoimoveisfranca";
import rochacoimbraimoveis from "./rochacoimbraimoveis";
import aferreiraimoveis from "./aferreiraimoveis";
import andrecaetano from "./andrecaetano";
import neoka from "./neoka";
import cidadenovaimoveis from "./cidadenovaimoveis";
import realizacca from "./realizacca";

export const sites: Site[] = [
  andrecaetano,
  neoka,
  cidadenovaimoveis as unknown as Site,
  realizacca as unknown as Site,
  mercadoimoveisfranca,
  rochacoimbraimoveis,
  aferreiraimoveis,
  oasisimobiliaria,
  matriz as unknown as Site,
  imobiliarialemos,
  c15imob, aacosta, agnelloimoveis, imoveisfranca, espaconobreimoveis,
  imobiliariapimentafranca, mazzaimoveis, parraimobiliaria, vtiimoveis,
  botelhoimobiliaria, unioconimobiliaria, imobiliariaplano,
  transacaoimobiliaria, conectaassesconimoveis, gpsnegociosimobiliarios,
  r2imob, artefattoimoveis, anzimoveis, zagoimoveis, bragaimobiliaria, groupagility,
  silveiraimoveis, sueliandradelopes, futuraimobiliariafranca, casanovaimoveis,
  unicafrancaimoveis as unknown as Site, imperadorimoveis as unknown as Site, nielsenimoveis as unknown as Site,
  imobiliarialadonni as unknown as Site, pucciimobiliaria as unknown as Site,
  cintraimoveis as unknown as Site, tratoimoveis as unknown as Site, faleirosimoveis as unknown as Site, moradiaimoveis as unknown as Site, andresaborgesimoveis as unknown as Site,
  iegimoveisfrancaeregiao as unknown as Site, salimimobiliaria as unknown as Site, boscoimoveis as unknown as Site,
  famaimoveisfranca as unknown as Site, carlosimoveisfranca as unknown as Site,
  dinizmartins as unknown as Site, grupohabitat as unknown as Site, habitesefranca as unknown as Site, altagalleria as unknown as Site, locallizegoldimob as unknown as Site,
  ...imoveismpb as unknown as Site[]
] as unknown as Site[];
