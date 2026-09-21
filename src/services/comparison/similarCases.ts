import {
  SingleFieldComparison,
} from "../../types";


export interface ComparisonCase {
  caseId: string;
  fields: SingleFieldComparison[];
}


// Store previous comparison cases
const previousCases: ComparisonCase[] = [];


// Save a comparison case
export function saveComparisonCase(
  caseData: ComparisonCase
): void {

  previousCases.push(caseData);
}


// Find similar previous cases
export function findSimilarCases(
  currentFields: SingleFieldComparison[]
): ComparisonCase[] {

  return previousCases.filter((previousCase) => {

    let matchingFields = 0;


    for (const currentField of currentFields) {

      const previousField = previousCase.fields.find(
        (field) =>
          field.field === currentField.field
      );


      if (
        previousField &&
        previousField.status === currentField.status
      ) {

        matchingFields++;
      }
    }


    return matchingFields >= 5;
  });
}