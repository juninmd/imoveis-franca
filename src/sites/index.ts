import aacosta from './aacosta';
import agnelloimoveis from './agnelloimoveis';
import imoveisfranca from './imoveis-franca';
import espaconobreimoveis from './espaconobreimoveis';
import { Site } from '../types';
import imobiliariapimentafranca from './imobiliariapimentafranca';
import imoveismpb from './imoveismpb';

export const sites: Site[] = [aacosta, agnelloimoveis, imoveisfranca, espaconobreimoveis, imobiliariapimentafranca, ...imoveismpb as unknown as Site[]];