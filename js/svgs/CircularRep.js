/**
 * Circular representation of the classroom during a session
 * @module sketches/CircularRep
 * @author Basile Pesin
 */

class CircularRep extends Rep {
    constructor(holder, currentTeacher, parameters = null) {
        super(currentTeacher, parameters)

        // Setting default parameters
        if(!parameters) {
            this.parameters = {
                'agencement':'num',
                'duree':'30',
                'niveau':'none',
                'display-proximite':false,
                'display-TDOP_Enseignant':false,
                'display-TDOP_Eleve':false
            }
        } else {
            this.parameters = parameters
        }

        // Basic setup
        $('#'+holder).empty()
        let width = $('#'+holder).innerWidth()
        this.draw = SVG(holder).size(width, width)

        // Background
        var bg = this.draw.group()
        this.bgTDOP = this.draw.circle(width).attr({ fill: '#99ffb3' })
        this.bgProx2 = this.draw.circle(3*width/4).attr({ fill: '#d3d3d3' }).opacity(0).move(width/8, width/8)
        this.bgProx1 = this.draw.circle(width/2).attr({ fill: '#a0a0a0' }).opacity(0).move(width/4, width/4)
        bg.add(this.bgTDOP)
        bg.add(this.bgProx2)
        bg.add(this.bgProx1)

        // Teacher
        this.teacherVerb= this.draw.circle(80).attr({ fill: '#f00' })
        this.teacherVerb.move(this.draw.width()/2-40, this.draw.height()/2-40)
        this.teacher = this.draw.circle(40).attr({ fill: '#fff', stroke:'#000', 'stroke-width': '10' }).move(20, 20)
        this.teacher.move(this.draw.width()/2-20, this.draw.height()/2-20)

        // Students
        this.svgStudents = []
        this.students = students.filter(s => (s.teacherId == currentTeacher))
        let nbStudents = this.students.length
        this.students.forEach(s => {
            s.createCircularRep(this.draw, width/2, nbStudents)
        })
    }
    
    /**
     * On form change
     */
    changeParameters(form) {
        if(form.attr('type')==='checkbox') this.parameters[form.attr('name')] = form.prop('checked')
        else this.parameters[form.attr('name')] = form.attr('tabindex')
    }

    /**
     * Apply the parameters
     */
    applyParameters() {
        super.applyParameters()

        // Proximity
        if(this.parameters["display-proximite"]) {
            this.bgProx1.animate(200).opacity(1)
            this.bgProx2.animate(200).opacity(1)
        } else {
            this.bgProx1.animate(200).opacity(0)
            this.bgProx2.animate(200).opacity(0)
        }

        // Students changes
        this.students.forEach(s => {
            // Level of skill
            s.setColorAccordingToNiveau(this.parameters['niveau'])

            // TDOP TODO Finir ca
            if(this.parameters['display-TDOP_Eleve']) s.setCircularTDOPEleve(null)
            else s.setCircularTDOPEleve(null)
        })

        // Verbalisation (ou pas)
        this.teacherVerb.opacity(0)
        this.currentEvents.forEach(e => {
            if(e.verbalisation) this.teacherVerb.opacity(1)
        })

        // TDOP
        this.updateTDOP()

        // Regards
        this.updateRegards()
    }

    /**
     * Updates the background color according to TDOP
     */
    updateTDOP() {
        let TDOPTypes = [null, 'TRANS', 'EXE_INT', 'C_AV', 'Trav-IND', 'C-EV', 'Prés-E']
        let countTDOPS = TDOPTypes.map(t => this.currentEvents.filter(x => x.TDOP===t).length)
        let max = 0
        for(let i=1; i<TDOPTypes.length; i++) {
            if(countTDOPS[i] > countTDOPS[max]) max = i;
        }
        this.bgTDOP.opacity(1)
        switch(TDOPTypes[max]) {
            case 'TRANS':
                this.bgTDOP.attr({fill: '#2ECCFA'})
                break
            case 'EXE_INT':
                this.bgTDOP.attr({fill: '#58FAF4'})
                break
            case 'C_AV':
                this.bgTDOP.attr({fill: '#2EFE9A'})
                break
            case 'Trav-IND':
                this.bgTDOP.attr({fill: '#00FF40'})
                break
            case 'C-EV':
                this.bgTDOP.attr({fill: '#9AFE2E'})
                break
            case 'Prés-E':
                this.bgTDOP.attr({fill: '#F7FE2E'})
                break
            case null:
                this.bgTDOP.opacity(0)
                break
        }
    }

    /**
     * Update regards from teacher to students (lines)
     */
    updateRegards() {
        let res = super.updateRegards()
        let frequency = res[0]
        let duration = res[1]

        let maxDuration = duration.reduce((x, y) => Math.max(x, y), 0)
        duration = duration.map(d => Math.floor(d*255/maxDuration))
        let maxFrequency = frequency.reduce((x, y) => Math.max(x, y), 0)
        frequency = frequency.map(f => Math.ceil(f*10/maxFrequency))
        for(let i=0; i<this.students.length; i++) {
            if(!duration[i]) continue
            this.regards.push(this.draw.line(this.draw.width()/2, 
                this.draw.height()/2, 
                this.students[i].rep.x() + this.students[i].repCircle.width()/2, 
                this.students[i].rep.y() + this.students[i].repCircle.height()/2,
            ).stroke({ width: frequency[i], color: 'rgb(' + (255-duration[i]).toString() + ',' + (255-duration[i]).toString() + ',' + (255-duration[i]).toString() + ')' }))
        }

        // Move teacher and students at the front again
        this.students.forEach(s => { s.rep.front() })
        this.teacher.front()
    }
}
